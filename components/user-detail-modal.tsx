"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Users,
  Settings,
  Eye,
  EyeOff,
  Globe,
  Trash2,
} from "lucide-react";
import { getStoredTokens } from "@/lib/auth";
import { formatDistanceToNow } from "@/lib/date-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteUserDialog } from "./delete-user-dialog";
import { toast } from "sonner";

interface UserDetail {
  _id: string;
  username: string;
  email: string;
  phone: string;
  hashPassword: string;
  groups: string[];
  dateOfBirth: string | null;
  avatarUrl: string | null;
  verify: "verified" | "unverified";
  verificationType: "email" | "phone";
  friends: any[];
  blockedUsers: any[];
  preferences: Record<string, any>;
  privacySettings: {
    profileVisibility: string;
    friendRequests: string;
  };
  google: { googleId: string } | null;
  facebook: any | null;
  twitter: any | null;
  createdAt: string;
  updatedAt: string;
  lastLoginTime?: string;
}

interface UserDetailResponse {
  message: string;
  status: number;
  data: {
    user: UserDetail;
  };
}

interface UserDetailModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserDetailModal({
  userId,
  isOpen,
  onClose,
}: UserDetailModalProps) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const fetchUserDetail = async (id: string) => {
    setLoading(true);
    setError("");

    try {
      const tokens = getStoredTokens();
      if (!tokens) {
        throw new Error("No authentication tokens found");
      }

      const response = await fetch(
        `https://fairsplit-server.onrender.com/api/v1/admin/users/${id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens.accessToken}`,
          },
          body: JSON.stringify({
            refreshToken: tokens.refreshToken,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user details");
      }

      const data: UserDetailResponse = await response.json();

      if (data.status === 200) {
        setUser(data.data.user);
      } else {
        setError(data.message || "Failed to fetch user details");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (
    userId: string,
    verify: "verified" | "unverified"
  ) => {
    try {
      const tokens = getStoredTokens();
      if (!tokens) {
        throw new Error("No authentication tokens found");
      }

      const response = await fetch(
        `https://fairsplit-server.onrender.com/api/v1/admin/users/${userId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens.accessToken}`,
          },
          body: JSON.stringify({
            verify: verify,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update user status");
      }

      const data = await response.json();

      if (data.status === 200) {
        // Refresh user data
        if (userId) {
          await fetchUserDetail(userId);
        }
        toast(`User status updated to ${verify}`);
      } else {
        throw new Error(data.message || "Failed to update user status");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update user status"
      );
    }
  };

  const handleDeleteSuccess = () => {
    onClose(); // Close the detail modal
    // The parent component will handle refreshing the list
  };

  useEffect(() => {
    if (userId && isOpen) {
      fetchUserDetail(userId);
    }
  }, [userId, isOpen]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getVerificationBadge = (verify: string) => {
    return verify === "verified" ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <Shield className="w-3 h-3 mr-1" />
        Verified
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
        <Shield className="w-3 h-3 mr-1" />
        Unverified
      </Badge>
    );
  };

  const getLoginProviders = (user: UserDetail) => {
    const providers = [];
    if (user.google?.googleId) providers.push("Google");
    if (user.facebook) providers.push("Facebook");
    if (user.twitter) providers.push("Twitter");
    if (providers.length === 0) providers.push("Email");
    return providers;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            Comprehensive information about the selected user
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : user ? (
          <div className="space-y-6">
            {/* User Profile Header */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={user.avatarUrl || undefined} />
                    <AvatarFallback className="text-lg">
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-2xl font-bold">{user.username}</h3>
                        {getVerificationBadge(user.verify)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              Update Status
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() =>
                                updateUserStatus(user._id, "verified")
                              }
                              disabled={user.verify === "verified"}
                            >
                              <Shield className="w-4 h-4 mr-2 text-green-600" />
                              Mark as Verified
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                updateUserStatus(user._id, "unverified")
                              }
                              disabled={user.verify === "unverified"}
                            >
                              <Shield className="w-4 h-4 mr-2 text-yellow-600" />
                              Mark as Unverified
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setIsDeleteDialogOpen(true)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete User
                        </Button>
                      </div>
                    </div>
                    <p className="text-muted-foreground">{user.email}</p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>ID: {user._id}</span>
                      <span>•</span>
                      <span>
                        Joined{" "}
                        {formatDistanceToNow(new Date(user.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Email:</span>
                    <span>{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Phone:</span>
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {user.dateOfBirth && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Date of Birth:</span>
                      <span>
                        {new Date(user.dateOfBirth).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Verification:</span>
                    <span>{user.verificationType}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Account Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    Account Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Verification Status:</span>
                    {getVerificationBadge(user.verify)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Login Providers:</span>
                    <div className="flex space-x-1">
                      {getLoginProviders(user).map((provider) => (
                        <Badge key={provider} variant="outline">
                          {provider}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Profile Visibility:</span>
                    <Badge variant="secondary" className="flex items-center">
                      {user.privacySettings.profileVisibility === "public" ? (
                        <Eye className="w-3 h-3 mr-1" />
                      ) : (
                        <EyeOff className="w-3 h-3 mr-1" />
                      )}
                      {user.privacySettings.profileVisibility}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Friend Requests:</span>
                    <Badge variant="outline">
                      {user.privacySettings.friendRequests}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Social Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Social Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Groups:</span>
                    <Badge variant="default">{user.groups.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Friends:</span>
                    <Badge variant="default">{user.friends.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Blocked Users:</span>
                    <Badge variant="destructive">
                      {user.blockedUsers.length}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Activity Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="w-4 h-4 mr-2" />
                    Activity Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="font-medium">Created:</span>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Last Updated:</span>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(user.updatedAt)}
                    </p>
                  </div>
                  {user.lastLoginTime && (
                    <div>
                      <span className="font-medium">Last Login:</span>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(user.lastLoginTime)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* OAuth Connections */}
            {(user.google || user.facebook || user.twitter) && (
              <Card>
                <CardHeader>
                  <CardTitle>OAuth Connections</CardTitle>
                  <CardDescription>
                    Connected social media accounts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {user.google && (
                      <div className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-red-500 rounded"></div>
                          <span>Google</span>
                        </div>
                        <Badge variant="outline">
                          ID: {user.google.googleId}
                        </Badge>
                      </div>
                    )}
                    {user.facebook && (
                      <div className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-blue-500 rounded"></div>
                          <span>Facebook</span>
                        </div>
                        <Badge variant="outline">Connected</Badge>
                      </div>
                    )}
                    {user.twitter && (
                      <div className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-sky-500 rounded"></div>
                          <span>Twitter</span>
                        </div>
                        <Badge variant="outline">Connected</Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Groups List */}
            {user.groups.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Groups</CardTitle>
                  <CardDescription>Groups this user belongs to</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {user.groups.map((groupId) => (
                      <Badge key={groupId} variant="outline">
                        {groupId.slice(-8)}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
        <DeleteUserDialog
          userId={user?._id || null}
          username={user?.username || ""}
          email={user?.email || ""}
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onSuccess={handleDeleteSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
