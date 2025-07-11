"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
  Calendar,
  Archive,
  Eye,
  MoreHorizontal,
  Trash2,
  Settings,
  Crown,
  User,
  DollarSign,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { makeAuthenticatedRequest } from "@/lib/auth";
import { formatDistanceToNow } from "@/lib/date-utils";
import { toast } from "sonner";
import { GroupDetailModal } from "@/components/group-detail-modal";

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

interface Group {
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

interface GroupsResponse {
  message: string;
  status: number;
  data: {
    groups: Group[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

type GroupStatus = "active" | "inactive" | "archived";
type SortBy = "name" | "createdAt" | "updatedAt" | "members";
type SortOrder = "asc" | "desc";

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<SortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [statusFilter, setStatusFilter] = useState<"all" | GroupStatus>("all");
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Group detail modal
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Delete group state
  const [deleteGroup, setDeleteGroup] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchGroups = async (page = 1, limit = 10, search = "") => {
    setLoading(true);
    setError("");

    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
        ...(search && { search }),
      });

      const response = await makeAuthenticatedRequest(
        `https://fairsplit-server.onrender.com/api/v1/admin/groups?${queryParams}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch groups");
      }

      const data: GroupsResponse = await response.json();

      if (data.status === 200) {
        let filteredGroups = data.data.groups;

        // Apply status filter
        if (statusFilter !== "all") {
          filteredGroups = filteredGroups.filter((group) => {
            if (statusFilter === "archived") return group.isArchived;
            if (statusFilter === "active") return !group.isArchived;
            return true;
          });
        }

        setGroups(filteredGroups);
        setPagination({
          totalItems: data.data.pagination.totalItems,
          totalPages: data.data.pagination.totalPages,
          hasNextPage: data.data.pagination.hasNextPage,
          hasPrevPage: data.data.pagination.hasPrevPage,
        });
      } else {
        setError(data.message || "Failed to fetch groups");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const updateGroupStatus = async (groupId: string, status: GroupStatus) => {
    try {
      const response = await makeAuthenticatedRequest(
        `https://fairsplit-server.onrender.com/api/v1/admin/groups/${groupId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update group status");
      }

      const data = await response.json();

      if (data.status === 200) {
        toast.success(`Group status updated to ${status}`);
        // Refresh groups list
        await fetchGroups(currentPage, pageSize, searchTerm);
      } else {
        throw new Error(data.message || "Failed to update group status");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update group status"
      );
    }
  };

  const deleteGroupById = async () => {
    if (!deleteGroup) return;

    setIsDeleting(true);

    try {
      const response = await makeAuthenticatedRequest(
        `https://fairsplit-server.onrender.com/api/v1/admin/groups/${deleteGroup.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete group");
      }

      const data = await response.json();

      if (data.status === 200) {
        toast.success(
          `Group "${deleteGroup.name}" has been deleted successfully`
        );
        setIsDeleteDialogOpen(false);
        setDeleteGroup(null);
        // Refresh groups list
        await fetchGroups(currentPage, pageSize, searchTerm);
      } else {
        throw new Error(data.message || "Failed to delete group");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete group"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    fetchGroups(currentPage, pageSize, searchTerm);
  }, [currentPage, pageSize, sortBy, sortOrder, statusFilter]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchGroups(1, pageSize, searchTerm);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(Number.parseInt(newSize));
    setCurrentPage(1);
  };

  const handleSortChange = (newSortBy: SortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
  };

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const getStatusBadge = (group: Group) => {
    if (group.isArchived) {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800">
          <Archive className="w-3 h-3 mr-1" />
          Archived
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
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

  const handleViewGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
    setIsDetailModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedGroupId(null);
    setIsDetailModalOpen(false);
  };

  const handleDeleteGroup = (group: Group) => {
    setDeleteGroup({ id: group._id, name: group.name });
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteDialogClose = () => {
    setIsDeleteDialogOpen(false);
    setDeleteGroup(null);
  };

  const getOwner = (members: GroupMember[]) => {
    return members.find((member) => member.role === "owner");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Groups Management
          </h1>
          <p className="text-muted-foreground">
            Manage user groups and their settings
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            Total: {pagination.totalItems} groups
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.totalItems}</div>
            <p className="text-xs text-muted-foreground">All groups</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Groups</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {groups.filter((group) => !group.isArchived).length}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Archived Groups
            </CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {groups.filter((group) => group.isArchived).length}
            </div>
            <p className="text-xs text-muted-foreground">Archived groups</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {groups.reduce((total, group) => total + group.members.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Across all groups</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>
            Find and filter groups by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as typeof statusFilter)
              }
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as SortBy)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="createdAt">Created</SelectItem>
                <SelectItem value="updatedAt">Updated</SelectItem>
                <SelectItem value="members">Members</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Search"
              )}
            </Button>
            <Select
              value={pageSize.toString()}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Groups Table */}
      <Card>
        <CardHeader>
          <CardTitle>Groups List</CardTitle>
          <CardDescription>
            Page {currentPage} of {pagination.totalPages} (
            {pagination.totalItems} total groups)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSortChange("name")}
                    >
                      Group{" "}
                      {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSortChange("members")}
                    >
                      Members{" "}
                      {sortBy === "members" &&
                        (sortOrder === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSortChange("createdAt")}
                    >
                      Created{" "}
                      {sortBy === "createdAt" &&
                        (sortOrder === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSortChange("updatedAt")}
                    >
                      Updated{" "}
                      {sortBy === "updatedAt" &&
                        (sortOrder === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map((group) => {
                    const owner = getOwner(group.members);
                    return (
                      <TableRow key={group._id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={group.avatarUrl || undefined} />
                              <AvatarFallback>
                                {group.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{group.name}</div>
                              <div className="text-sm text-muted-foreground max-w-[200px] truncate">
                                {group.description}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">
                              {owner?.userId.slice(-8) || "N/A"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {group.members.length}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {group.settings.currency}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(group)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{formatDate(group.createdAt)}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(group.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{formatDate(group.updatedAt)}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(group.updatedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewGroup(group._id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleViewGroup(group._id)}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {group.isArchived ? (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      updateGroupStatus(group._id, "active")
                                    }
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                    Activate Group
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      updateGroupStatus(group._id, "archived")
                                    }
                                  >
                                    <Archive className="w-4 h-4 mr-2 text-yellow-600" />
                                    Archive Group
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => handleDeleteGroup(group)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Group
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {groups.length === 0 && !loading && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No groups found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm
                      ? "No groups match your search criteria."
                      : "No groups have been created yet."}
                  </p>
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * pageSize + 1} to{" "}
                    {Math.min(currentPage * pageSize, pagination.totalItems)} of{" "}
                    {pagination.totalItems} groups
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!pagination.hasPrevPage}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from(
                        { length: Math.min(5, pagination.totalPages) },
                        (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <Button
                              key={pageNum}
                              variant={
                                currentPage === pageNum ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        }
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Group Detail Modal */}
      <GroupDetailModal
        groupId={selectedGroupId}
        isOpen={isDetailModalOpen}
        onClose={handleCloseModal}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete Group
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to delete this group? This action cannot
                be undone.
              </p>
              {deleteGroup && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="font-medium">Group Details:</p>
                  <p className="text-sm">Name: {deleteGroup.name}</p>
                  <p className="text-sm">ID: {deleteGroup.id}</p>
                </div>
              )}
              <p className="text-destructive font-medium">
                ⚠️ This will permanently delete the group and all associated
                data including expenses and transactions.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteGroupById}
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
                  Delete Group
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
