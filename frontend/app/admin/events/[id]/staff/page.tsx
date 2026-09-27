"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableRow, TableCell } from "@/components/ui/table";
import { ConfirmModal, Modal } from "@/components/ui/modal";
import { STAFF_MEMBERS } from "@/constants/mock-data";

export default function EventStaffPage() {
  const params = useParams();
  const id = params.id as string;
  const [staff, setStaff] = useState(STAFF_MEMBERS);
  const [showAdd, setShowAdd] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setStaff([
      ...staff,
      {
        id: `s-${Date.now()}`,
        name: form.get("name") as string,
        email: form.get("email") as string,
        role: form.get("role") as string,
      },
    ]);
    setShowAdd(false);
  };

  return (
    <div>
      <PageHeader
        title="Event Staff"
        action={
          <div className="flex gap-2">
            <Button onClick={() => setShowAdd(true)}>Add Staff</Button>
            <Link href={`/admin/events/${id}`}>
              <Button variant="outline" size="sm">
                Back
              </Button>
            </Link>
          </div>
        }
      />

      <Table headers={["Name", "Email", "Role", "Actions"]}>
        {staff.map((s) => (
          <TableRow key={s.id}>
            <TableCell>{s.name}</TableCell>
            <TableCell>{s.email}</TableCell>
            <TableCell>{s.role}</TableCell>
            <TableCell>
              <Button variant="ghost" size="sm" onClick={() => setRemoveId(s.id)}>
                Remove
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </Table>

      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add Staff Member"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button type="submit" form="add-staff-form">
              Add
            </Button>
          </>
        }
      >
        <form id="add-staff-form" onSubmit={handleAdd} className="space-y-4">
          <Input label="Name" id="name" name="name" required defaultValue="New Staff" />
          <Input label="Email" id="email" name="email" type="email" required defaultValue="staff@pu.ac.in" />
          <Select
            label="Role"
            id="role"
            name="role"
            options={[
              { value: "Scanner", label: "Scanner" },
              { value: "Coordinator", label: "Coordinator" },
              { value: "Help Desk", label: "Help Desk" },
            ]}
          />
        </form>
      </Modal>

      <ConfirmModal
        open={!!removeId}
        onClose={() => setRemoveId(null)}
        onConfirm={() => {
          setStaff(staff.filter((s) => s.id !== removeId));
        }}
        title="Remove Staff"
        message="Remove this staff member from the event?"
        confirmLabel="Remove"
      />
    </div>
  );
}
