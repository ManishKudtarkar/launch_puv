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
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { AssignMemberDto } from '../communities/dto/assign-member.dto';
import { generateSlug } from '../../common/utils/slug.util';

@Injectable()
export class ClubsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(communityId?: string, user?: AuthenticatedUser, search?: string) {
    const isSuperAdmin = user?.role === Role.SUPER_ADMIN;

    const whereClause: any = {};
    if (!isSuperAdmin) {
      whereClause.status = EntityStatus.ACTIVE;
    }
    if (communityId) {
      whereClause.communityId = communityId;
    }
    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { shortDescription: { contains: search } },
      ];
    }

    const clubs = await this.prisma.club.findMany({
      where: whereClause,
      include: {
        community: {
          select: { id: true, name: true, slug: true },
        },
        head: {
          select: { id: true, fullName: true, email: true },
        },
        _count: {
          select: {
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

    let followedClubIds = new Set<string>();
    if (user) {
      const userFollows = await this.prisma.follow.findMany({
        where: { userId: user.userId, clubId: { not: null } },
        select: { clubId: true },
      });
      followedClubIds = new Set(userFollows.map((f) => f.clubId as string));
    }

    return clubs.map((club) => ({
      ...club,
      followerCount: club._count.followers,
      eventCount: club._count.events,
      approvedUpdateCount: club._count.updates,
      isFollowing: followedClubIds.has(club.id),
    }));
  }

  async findOne(slugOrId: string, user?: AuthenticatedUser) {
    const isSuperAdmin = user?.role === Role.SUPER_ADMIN;

    const club = await this.prisma.club.findFirst({
      where: {
        OR: [{ id: slugOrId }, { slug: slugOrId }],
      },
      include: {
        community: {
          select: { id: true, name: true, slug: true },
        },
        head: {
          select: { id: true, fullName: true, email: true },
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
            events: true,
          },
        },
      },
    });

    if (!club) {
      throw new NotFoundException('Club not found');
    }

    if (!isSuperAdmin && club.status !== EntityStatus.ACTIVE) {
      throw new NotFoundException('Club not found or inactive');
    }

    let isFollowing = false;
    if (user) {
      const follow = await this.prisma.follow.findUnique({
        where: {
          userId_clubId: {
            userId: user.userId,
            clubId: club.id,
          },
        },
      });
      isFollowing = !!follow;
    }

    return {
      ...club,
      followerCount: club._count.followers,
      eventCount: club._count.events,
      isFollowing,
    };
  }

  async create(dto: CreateClubDto, user: AuthenticatedUser) {
    if (user.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Only Super Admins can create clubs');
    }

    let slug = dto.slug ? generateSlug(dto.slug) : generateSlug(dto.name);
    const existing = await this.prisma.club.findUnique({
      where: { slug },
    });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    if (dto.communityId) {
      const parent = await this.prisma.community.findUnique({
        where: { id: dto.communityId },
      });
      if (!parent) {
        throw new BadRequestException('Specified parent community does not exist');
      }
    }

    if (dto.headId) {
      const headUser = await this.prisma.user.findUnique({
        where: { id: dto.headId },
      });
      if (!headUser) {
        throw new BadRequestException('Assigned head user does not exist');
      }
    }

    const club = await this.prisma.club.create({
      data: {
        name: dto.name,
        slug,
        communityId: dto.communityId,
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
          clubId: club.id,
          role: MembershipRole.HEAD,
        },
      });
    }

    return club;
  }

  async update(id: string, dto: UpdateClubDto, user: AuthenticatedUser) {
    const club = await this.prisma.club.findUnique({
      where: { id },
      include: { memberships: true },
    });

    if (!club) {
      throw new NotFoundException('Club not found');
    }

    const isSuperAdmin = user.role === Role.SUPER_ADMIN;
    const isHead =
      club.headId === user.userId ||
      club.memberships.some(
        (m) => m.userId === user.userId && m.role === MembershipRole.HEAD,
      );

    if (!isSuperAdmin && !isHead) {
      throw new ForbiddenException(
        'Only Super Admins or Club Heads can edit this club',
      );
    }

    if (dto.headId && !isSuperAdmin) {
      throw new ForbiddenException(
        'Only Super Admins can assign or change club head',
      );
    }

    if (dto.communityId !== undefined && !isSuperAdmin) {
      throw new ForbiddenException(
        'Only Super Admins can reassign parent community',
      );
    }

    if (dto.slug && dto.slug !== club.slug) {
      const existingSlug = await this.prisma.club.findUnique({
        where: { slug: dto.slug },
      });
      if (existingSlug && existingSlug.id !== id) {
        throw new ConflictException('Slug is already in use');
      }
    }

    if (dto.communityId) {
      const parent = await this.prisma.community.findUnique({
        where: { id: dto.communityId },
      });
      if (!parent) {
        throw new BadRequestException('Specified parent community does not exist');
      }
    }

    if (dto.headId && dto.headId !== club.headId) {
      const headUser = await this.prisma.user.findUnique({
        where: { id: dto.headId },
      });
      if (!headUser) {
        throw new BadRequestException('Assigned head user does not exist');
      }

      await this.prisma.membership.deleteMany({
        where: { clubId: id, role: MembershipRole.HEAD },
      });

      await this.prisma.membership.upsert({
        where: {
          userId_clubId: {
            userId: dto.headId,
            clubId: id,
          },
        },
        update: { role: MembershipRole.HEAD },
        create: {
          userId: dto.headId,
          clubId: id,
          role: MembershipRole.HEAD,
        },
      });
    }

    return this.prisma.club.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug,
        communityId: dto.communityId,
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
      throw new ForbiddenException('Only Super Admins can change club status');
    }

    return this.prisma.club.update({
      where: { id },
      data: { status },
    });
  }

  async assignMember(id: string, dto: AssignMemberDto, user: AuthenticatedUser) {
    if (user.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Only Super Admins can assign club members or heads',
      );
    }

    const club = await this.prisma.club.findUnique({
      where: { id },
    });
    if (!club) {
      throw new NotFoundException('Club not found');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!targetUser) {
      throw new BadRequestException('User not found');
    }

    if (dto.role === MembershipRole.HEAD) {
      await this.prisma.membership.updateMany({
        where: { clubId: id, role: MembershipRole.HEAD },
        data: { role: MembershipRole.CORE_MEMBER },
      });

      await this.prisma.club.update({
        where: { id },
        data: { headId: dto.userId },
      });
    }

    return this.prisma.membership.upsert({
      where: {
        userId_clubId: {
          userId: dto.userId,
          clubId: id,
        },
      },
      update: { role: dto.role },
      create: {
        userId: dto.userId,
        clubId: id,
        role: dto.role,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  async removeMember(id: string, userId: string, user: AuthenticatedUser) {
    if (user.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Only Super Admins can remove club members');
    }

    const club = await this.prisma.club.findUnique({
      where: { id },
    });
    if (!club) {
      throw new NotFoundException('Club not found');
    }

    if (club.headId === userId) {
      await this.prisma.club.update({
        where: { id },
        data: { headId: null },
      });
    }

    await this.prisma.membership.deleteMany({
      where: {
        clubId: id,
        userId,
      },
    });

    return { message: 'Club member removed successfully' };
  }

  async follow(id: string, user: AuthenticatedUser) {
    const club = await this.prisma.club.findUnique({
      where: { id },
    });
    if (!club) {
      throw new NotFoundException('Club not found');
    }

    // Students may only follow active entities
    if (club.status !== EntityStatus.ACTIVE) {
      throw new ForbiddenException('Cannot follow an inactive club');
    }

    await this.prisma.follow.upsert({
      where: {
        userId_clubId: {
          userId: user.userId,
          clubId: id,
        },
      },
      update: {},
      create: {
        userId: user.userId,
        clubId: id,
      },
    });

    const followerCount = await this.prisma.follow.count({
      where: { clubId: id },
    });

    return { isFollowing: true, followerCount };
  }

  async unfollow(id: string, user: AuthenticatedUser) {
    await this.prisma.follow.deleteMany({
      where: {
        userId: user.userId,
        clubId: id,
      },
    });

    const followerCount = await this.prisma.follow.count({
      where: { clubId: id },
    });

    return { isFollowing: false, followerCount };
  }

  /**
   * Reusable Phase 2 helper.
   * Returns true if the given userId holds the specified role (or any membership
   * role if no role filter is provided) for the given clubId.
   * Never throws; callers decide how to handle the result.
   */
  async checkClubMembership(
    userId: string,
    clubId: string,
    role?: MembershipRole,
  ): Promise<boolean> {
    const membership = await this.prisma.membership.findFirst({
      where: {
        userId,
        clubId,
        ...(role ? { role } : {}),
      },
    });
    return !!membership;
  }
}
