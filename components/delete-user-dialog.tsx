"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2 } from "lucide-react";
import { getStoredTokens } from "@/lib/auth";
import { toast } from "sonner";

interface DeleteUserDialogProps {
  userId: string | null;
  username: string;
  email: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteUserDialog({
  userId,
  username,
  email,
  isOpen,
  onClose,
  onSuccess,
}: DeleteUserDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!userId) return;

    setIsDeleting(true);

    try {
      const tokens = getStoredTokens();
      if (!tokens) {
        throw new Error("No authentication tokens found");
      }

      const response = await fetch(
        `https://fairsplit-server.onrender.com/api/v1/admin/users/${userId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      const data = await response.json();

      if (data.status === 200 || response.status === 200) {
        toast("Success", {
          description: `User ${username} has been deleted successfully`,
        });
        onSuccess();
        onClose();
      } else {
        throw new Error(data.message || "Failed to delete user");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Delete User Account
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            Are you sure you want to delete this user account? This action
            cannot be undone.
            <div className="bg-muted p-3 rounded-md">
              <p className="font-medium">User Details:</p>
              <p className="text-sm">Username: {username}</p>
              <p className="text-sm">Email: {email}</p>
              <p className="text-sm">ID: {userId}</p>
            </div>
            ⚠️ This will permanently delete all user data, including groups,
            friends, and activity history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete User
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
