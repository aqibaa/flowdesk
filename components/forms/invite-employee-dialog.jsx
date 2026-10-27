"use client";

import { useActionState, useState } from "react";
import { Loader2Icon, UserPlusIcon } from "lucide-react";
import { toast } from "sonner";
import { inviteEmployee } from "@/lib/actions/team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/shared/form-message";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** "Invite Employee" button + modal. Simple form → useActionState. */
export function InviteEmployeeDialog() {
  const [open, setOpen] = useState(false);
  // Wrap the Server Action so success closes the dialog and toasts, while
  // field errors stay visible inline. (Done here, not in an effect.)
  const [state, action, pending] = useActionState(async (prev, formData) => {
    const result = await inviteEmployee(prev, formData);
    if (result.ok) {
      toast.success(result.message);
      setOpen(false);
    } else if (!result.errors) {
      toast.error(result.message);
    }
    return result;
  }, null);
  const errors = state?.errors ?? {};

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlusIcon /> Invite Employee
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite an employee</DialogTitle>
          <DialogDescription>
            They will receive an email with a link to set their password.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4" key={open ? "open" : "closed"}>
          <div className="space-y-2">
            <Label htmlFor="invite-name">Full name</Label>
            <Input id="invite-name" name="full_name" required aria-invalid={Boolean(errors.full_name)} />
            <FormMessage>{errors.full_name}</FormMessage>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input id="invite-email" name="email" type="email" required aria-invalid={Boolean(errors.email)} />
            <FormMessage>{errors.email}</FormMessage>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="invite-title">Job title</Label>
              <Input id="invite-title" name="job_title" placeholder="SEO Specialist" />
              <FormMessage>{errors.job_title}</FormMessage>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select name="role" defaultValue="employee">
                <SelectTrigger id="invite-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2Icon className="animate-spin" />}
              Send invite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
