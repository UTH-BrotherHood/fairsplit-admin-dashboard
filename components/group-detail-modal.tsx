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
  Users,
  Crown,
  User,
  Calendar,
  Settings,
  DollarSign,
  CheckCircle,
  XCircle,
  Archive,
  Globe,
} from "lucide-react";
import { makeAuthenticatedRequest } from "@/lib/auth";
import { formatDistanceToNow } from "@/lib/date-utils";

interface GroupMember {
  userId: string;
  role: "owner" | "member";
  joinedAt: string;
  nickname: string | null;
  updatedAt?: string;
}

interface GroupSettings {
  allowMembersInvite: boolean;
  allowMembersAddList: boolean;
  defaultSplitMethod: string;
  currency: string;
}

interface GroupDetail {
  _id: string;
  name: string;
  description: string;
  avatarUrl: string | null;
  members: GroupMember[];
  createdAt: string;
  updatedAt: string;
  isArchived: boolean;
  settings: GroupSettings;
}

interface GroupDetailResponse {
  message: string;
  status: number;
  data: {
    group: GroupDetail;
  };
}

interface GroupMembersResponse {
  message: string;
  status: number;
  data: {
    members: GroupMember[];
  };
}

interface GroupDetailModalProps {
  groupId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function GroupDetailModal({
  groupId,
  isOpen,
  onClose,
}: GroupDetailModalProps) {
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchGroupDetail = async (id: string) => {
    setLoading(true);
    setError("");

    try {
      // Fetch group details
      const groupResponse = await makeAuthenticatedRequest(
        `https://fairsplit-server.onrender.com/api/v1/admin/groups/${id}`
      );

      if (!groupResponse.ok) {
        throw new Error("Failed to fetch group details");
      }

      const groupData: GroupDetailResponse = await groupResponse.json();

      if (groupData.status === 200) {
        setGroup(groupData.data.group);
        setMembers(groupData.data.group.members);
      } else {
        setError(groupData.message || "Failed to fetch group details");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId && isOpen) {
      fetchGroupDetail(groupId);
    }
  }, [groupId, isOpen]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (isArchived: boolean) => {
    return isArchived ? (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
        <Archive className="w-3 h-3 mr-1" />
        Archived
      </Badge>
    ) : (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    return role === "owner" ? (
      <Badge variant="default" className="bg-yellow-100 text-yellow-800">
        <Crown className="w-3 h-3 mr-1" />
        Owner
      </Badge>
    ) : (
      <Badge variant="outline">
        <User className="w-3 h-3 mr-1" />
        Member
      </Badge>
    );
  };

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case "USD":
        return "$";
      case "VND":
        return "₫";
      case "EUR":
        return "€";
      default:
        return currency;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Group Details</DialogTitle>
          <DialogDescription>
            Comprehensive information about the selected group
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
        ) : group ? (
          <div className="space-y-6">
            {/* Group Profile Header */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={group.avatarUrl || undefined} />
                    <AvatarFallback className="text-lg">
                      {group.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-2xl font-bold">{group.name}</h3>
                        {getStatusBadge(group.isArchived)}
                      </div>
                    </div>
                    <p className="text-muted-foreground">{group.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>ID: {group._id}</span>
                      <span>•</span>
                      <span>
                        Created{" "}
                        {formatDistanceToNow(new Date(group.createdAt), {
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
                    <Globe className="w-4 h-4 mr-2" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total Members:</span>
                    <Badge variant="outline">{group.members.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Currency:</span>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      <span>{group.settings.currency}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Split Method:</span>
                    <Badge variant="secondary">
                      {group.settings.defaultSplitMethod}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Status:</span>
                    {getStatusBadge(group.isArchived)}
                  </div>
                </CardContent>
              </Card>

              {/* Group Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    Group Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Members Can Invite:</span>
                    {group.settings.allowMembersInvite ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Members Can Add Lists:</span>
                    {group.settings.allowMembersAddList ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Default Split:</span>
                    <Badge variant="outline">
                      {group.settings.defaultSplitMethod}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Currency:</span>
                    <span className="font-mono">
                      {getCurrencySymbol(group.settings.currency)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Activity Information */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Activity Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div>
                    <span className="font-medium">Created:</span>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(group.createdAt)}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Last Updated:</span>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(group.updatedAt)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Members List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Group Members ({members.length})
                </CardTitle>
                <CardDescription>All members of this group</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {members.map((member, index) => (
                    <div key={`${member.userId}-${index}`}>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {member.userId.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {member.nickname ||
                                `User ${member.userId.slice(-8)}`}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ID: {member.userId.slice(-8)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getRoleBadge(member.role)}
                          <div className="text-right text-sm text-muted-foreground">
                            <div>
                              Joined{" "}
                              {formatDistanceToNow(new Date(member.joinedAt), {
                                addSuffix: true,
                              })}
                            </div>
                            {member.updatedAt && (
                              <div>
                                Updated{" "}
                                {formatDistanceToNow(
                                  new Date(member.updatedAt),
                                  { addSuffix: true }
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
