import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
  EntityStatus,
  MembershipRole,
  Role,
  UpdateStatus,
} from '../../generated/prisma/enums';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { AssignMemberDto } from './dto/assign-member.dto';
import { generateSlug } from '../../common/utils/slug.util';

@Injectable()
export class CommunitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user?: AuthenticatedUser, search?: string) {
    const isSuperAdmin = user?.role === Role.SUPER_ADMIN;

    const communities = await this.prisma.community.findMany({
      where: {
        ...(isSuperAdmin ? {} : { status: EntityStatus.ACTIVE }),
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { shortDescription: { contains: search } },
              ],
            }
          : {}),
      },
      include: {
        head: {
          select: { id: true, fullName: true, email: true },
        },
        _count: {
          select: {
            clubs: true,
            followers: true,
            events: true,
            updates: {
              where: { status: UpdateStatus.APPROVED },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let followedCommunityIds = new Set<string>();
    if (user) {
      const userFollows = await this.prisma.follow.findMany({
        where: { userId: user.userId, communityId: { not: null } },
        select: { communityId: true },
      });
      followedCommunityIds = new Set(
        userFollows.map((f) => f.communityId as string),
      );
    }

    return communities.map((comm) => ({
      ...comm,
      followerCount: comm._count.followers,
      clubCount: comm._count.clubs,
      eventCount: comm._count.events,
      approvedUpdateCount: comm._count.updates,
      isFollowing: followedCommunityIds.has(comm.id),
    }));
  }

  async findOne(slugOrId: string, user?: AuthenticatedUser) {
    const isSuperAdmin = user?.role === Role.SUPER_ADMIN;

    const community = await this.prisma.community.findFirst({
      where: {
        OR: [{ id: slugOrId }, { slug: slugOrId }],
      },
      include: {
        head: {
          select: { id: true, fullName: true, email: true },
        },
        clubs: {
          where: isSuperAdmin ? {} : { status: EntityStatus.ACTIVE },
          include: {
            head: { select: { id: true, fullName: true, email: true } },
            _count: { select: { followers: true, events: true } },
          },
        },
        memberships: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
        updates: {
          where: isSuperAdmin ? {} : { status: UpdateStatus.APPROVED },
          include: {
            author: { select: { id: true, fullName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        events: {
          where: isSuperAdmin
            ? {}
            : { status: { in: ['PUBLISHED', 'APPROVED'] } },
          orderBy: { eventDate: 'desc' },
        },
        _count: {
          select: {
            followers: true,
            clubs: true,
            events: true,
          },
        },
      },
    });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    if (!isSuperAdmin && community.status !== EntityStatus.ACTIVE) {
      throw new NotFoundException('Community not found or inactive');
    }

    let isFollowing = false;
    if (user) {
      const follow = await this.prisma.follow.findUnique({
        where: {
          userId_communityId: {
            userId: user.userId,
            communityId: community.id,
          },
        },
      });
      isFollowing = !!follow;
    }

    return {
      ...community,
      followerCount: community._count.followers,
      clubCount: community._count.clubs,
      eventCount: community._count.events,
      isFollowing,
    };
  }

  async create(dto: CreateCommunityDto, user: AuthenticatedUser) {
    if (user.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Only Super Admins can create communities',
      );
    }

    let slug = dto.slug ? generateSlug(dto.slug) : generateSlug(dto.name);
    const existing = await this.prisma.community.findUnique({
      where: { slug },
    });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    if (dto.headId) {
      const headUser = await this.prisma.user.findUnique({
        where: { id: dto.headId },
      });
      if (!headUser) {
        throw new BadRequestException('Assigned head user does not exist');
      }
    }

    const community = await this.prisma.community.create({
      data: {
        name: dto.name,
        slug,
        shortDescription: dto.shortDescription,
        fullDescription: dto.fullDescription,
        bannerUrl: dto.bannerUrl,
        logoUrl: dto.logoUrl,
        headId: dto.headId,
      },
    });

    if (dto.headId) {
      await this.prisma.membership.create({
        data: {
          userId: dto.headId,
          communityId: community.id,
          role: MembershipRole.HEAD,
        },
      });
    }

    return community;
  }

  async update(id: string, dto: UpdateCommunityDto, user: AuthenticatedUser) {
    const community = await this.prisma.community.findUnique({
      where: { id },
      include: { memberships: true },
    });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    const isSuperAdmin = user.role === Role.SUPER_ADMIN;
    const isHead =
      community.headId === user.userId ||
      community.memberships.some(
        (m) => m.userId === user.userId && m.role === MembershipRole.HEAD,
      );

    if (!isSuperAdmin && !isHead) {
      throw new ForbiddenException(
        'Only Super Admins or Community Heads can edit this community',
      );
    }

    if (dto.headId && !isSuperAdmin) {
      throw new ForbiddenException(
        'Only Super Admins can assign or change community head',
      );
    }

    if (dto.slug && dto.slug !== community.slug) {
      const existingSlug = await this.prisma.community.findUnique({
        where: { slug: dto.slug },
      });
      if (existingSlug && existingSlug.id !== id) {
        throw new ConflictException('Slug is already in use');
      }
    }

    if (dto.headId && dto.headId !== community.headId) {
      const headUser = await this.prisma.user.findUnique({
        where: { id: dto.headId },
      });
      if (!headUser) {
        throw new BadRequestException('Assigned head user does not exist');
      }

      await this.prisma.membership.deleteMany({
        where: { communityId: id, role: MembershipRole.HEAD },
      });

      await this.prisma.membership.upsert({
        where: {
          userId_communityId: {
            userId: dto.headId,
            communityId: id,
          },
        },
        update: { role: MembershipRole.HEAD },
        create: {
          userId: dto.headId,
          communityId: id,
          role: MembershipRole.HEAD,
        },
      });
    }

    return this.prisma.community.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug,
        shortDescription: dto.shortDescription,
        fullDescription: dto.fullDescription,
        bannerUrl: dto.bannerUrl,
        logoUrl: dto.logoUrl,
        headId: dto.headId,
      },
    });
  }

  async toggleStatus(
    id: string,
    status: EntityStatus,
    user: AuthenticatedUser,
  ) {
    if (user.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Only Super Admins can change community status',
      );
    }

    return this.prisma.community.update({
      where: { id },
      data: { status },
    });
  }

  async assignMember(id: string, dto: AssignMemberDto, user: AuthenticatedUser) {
    if (user.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Only Super Admins can assign members or heads',
      );
    }

    const community = await this.prisma.community.findUnique({
      where: { id },
    });
    if (!community) {
      throw new NotFoundException('Community not found');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!targetUser) {
      throw new BadRequestException('User not found');
    }

    if (dto.role === MembershipRole.HEAD) {
      await this.prisma.membership.updateMany({
        where: { communityId: id, role: MembershipRole.HEAD },
        data: { role: MembershipRole.CORE_MEMBER },
      });

      await this.prisma.community.update({
        where: { id },
        data: { headId: dto.userId },
      });
    }

    return this.prisma.membership.upsert({
      where: {
        userId_communityId: {
          userId: dto.userId,
          communityId: id,
        },
      },
      update: { role: dto.role },
      create: {
        userId: dto.userId,
        communityId: id,
        role: dto.role,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  async removeMember(id: string, userId: string, user: AuthenticatedUser) {
    if (user.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Only Super Admins can remove team members',
      );
    }

    const community = await this.prisma.community.findUnique({
      where: { id },
    });
    if (!community) {
      throw new NotFoundException('Community not found');
    }

    if (community.headId === userId) {
      await this.prisma.community.update({
        where: { id },
        data: { headId: null },
      });
    }

    await this.prisma.membership.deleteMany({
      where: {
        communityId: id,
        userId,
      },
    });

    return { message: 'Member removed successfully' };
  }

  async follow(id: string, user: AuthenticatedUser) {
    const community = await this.prisma.community.findUnique({
      where: { id },
    });
    if (!community) {
      throw new NotFoundException('Community not found');
    }

    // Students may only follow active entities
    if (community.status !== EntityStatus.ACTIVE) {
      throw new ForbiddenException('Cannot follow an inactive community');
    }

    await this.prisma.follow.upsert({
      where: {
        userId_communityId: {
          userId: user.userId,
          communityId: id,
        },
      },
      update: {},
      create: {
        userId: user.userId,
        communityId: id,
      },
    });

    const followerCount = await this.prisma.follow.count({
      where: { communityId: id },
    });

    return { isFollowing: true, followerCount };
  }

  async unfollow(id: string, user: AuthenticatedUser) {
    await this.prisma.follow.deleteMany({
      where: {
        userId: user.userId,
        communityId: id,
      },
    });

    const followerCount = await this.prisma.follow.count({
      where: { communityId: id },
    });

    return { isFollowing: false, followerCount };
  }

  /**
   * Reusable Phase 2 helper.
   * Returns true if the given userId holds the specified role (or any membership
   * role if no role filter is provided) for the given communityId.
   * Never throws; callers decide how to handle the result.
   */
  async checkMembership(
    userId: string,
    communityId: string,
    role?: MembershipRole,
  ): Promise<boolean> {
    const membership = await this.prisma.membership.findFirst({
      where: {
        userId,
        communityId,
        ...(role ? { role } : {}),
      },
    });
    return !!membership;
  }
}
