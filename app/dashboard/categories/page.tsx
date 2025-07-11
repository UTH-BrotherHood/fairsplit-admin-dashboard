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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Calendar,
  Hash,
  Trash2,
  Edit,
} from "lucide-react";
import { makeAuthenticatedRequest } from "@/lib/auth";
import { formatDistanceToNow } from "@/lib/date-utils";
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
import { CategoryActions } from "@/components/category-actions";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface Category {
  _id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface CategoriesResponse {
  message: string;
  status: number;
  data: {
    categories: Category[];
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

interface CreateCategoryResponse {
  message: string;
  status: number;
  data: {
    categoryId: string;
  };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Create category modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
  });

  // Update category modal state
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [categoryToUpdate, setCategoryToUpdate] = useState({
    id: "",
    name: "",
    description: "",
  });

  // Delete category state
  const [deleteCategory, setDeleteCategory] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk selection state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

  const fetchCategories = async (page = 1, limit = 10, search = "") => {
    setLoading(true);
    setError("");

    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
      });

      const response = await makeAuthenticatedRequest(
        `https://fairsplit-server.onrender.com/api/v1/admin/categories?${queryParams}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      const data: CategoriesResponse = await response.json();

      if (data.status === 200) {
        setCategories(data.data.categories);
        setPagination({
          totalItems: data.data.pagination.totalItems,
          totalPages: data.data.pagination.totalPages,
          hasNextPage: data.data.pagination.hasNextPage,
          hasPrevPage: data.data.pagination.hasPrevPage,
        });
      } else {
        setError(data.message || "Failed to fetch categories");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async () => {
    if (!newCategory.name.trim() || !newCategory.description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsCreating(true);

    try {
      const response = await makeAuthenticatedRequest(
        "https://fairsplit-server.onrender.com/api/v1/admin/categories",
        {
          method: "POST",
          body: JSON.stringify({
            name: newCategory.name.trim(),
            description: newCategory.description.trim(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create category");
      }

      const data: CreateCategoryResponse = await response.json();

      if (data.status === 200) {
        toast.success("Category created successfully");
        setIsCreateModalOpen(false);
        setNewCategory({ name: "", description: "" });
        // Refresh categories list
        await fetchCategories(currentPage, pageSize, searchTerm);
      } else {
        throw new Error(data.message || "Failed to create category");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create category"
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!categoryToUpdate.name.trim() || !categoryToUpdate.description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsUpdating(true);

    try {
      const response = await makeAuthenticatedRequest(
        `https://fairsplit-server.onrender.com/api/v1/admin/categories/${categoryToUpdate.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: categoryToUpdate.name.trim(),
            description: categoryToUpdate.description.trim(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update category");
      }

      const data = await response.json();

      if (data.status === 200) {
        toast.success("Category updated successfully");
        setIsUpdateModalOpen(false);
        setCategoryToUpdate({ id: "", name: "", description: "" });
        // Refresh categories list
        await fetchCategories(currentPage, pageSize, searchTerm);
      } else {
        throw new Error(data.message || "Failed to update category");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update category"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkDelete = async (categoryIds: string[]) => {
    setIsBulkDeleting(true);

    try {
      const response = await makeAuthenticatedRequest(
        `https://fairsplit-server.onrender.com/api/v1/admin/categories/bulk`,
        {
          method: "DELETE",
          body: JSON.stringify({
            categoryIds: categoryIds,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete categories");
      }

      const data = await response.json();

      if (data.status === 200) {
        const { successCount, failedCount, failed } = data.data;

        if (successCount > 0) {
          toast.success(
            `${successCount} ${
              successCount === 1 ? "category" : "categories"
            } deleted successfully${
              failedCount > 0 ? `, ${failedCount} failed` : ""
            }`
          );
        }

        if (failedCount > 0) {
          toast.error(
            `${failedCount} categories failed to delete: ${failed.join(", ")}`
          );
        }

        setIsBulkDeleteDialogOpen(false);
        setSelectedCategories([]);
        setDeleteCategory(null);
        // Refresh categories list
        await fetchCategories(currentPage, pageSize, searchTerm);
      } else {
        throw new Error(data.message || "Failed to delete categories");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete categories"
      );
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const deleteCategoryById = async () => {
    if (!deleteCategory) return;
    await handleBulkDelete([deleteCategory.id]);
  };

  const handleBulkDeleteSelected = async () => {
    if (selectedCategories.length === 0) return;
    await handleBulkDelete(selectedCategories);
  };

  useEffect(() => {
    fetchCategories(currentPage, pageSize, searchTerm);
  }, [currentPage, pageSize]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchCategories(1, pageSize, searchTerm);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(Number.parseInt(newSize));
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const handleCreateModalClose = () => {
    setIsCreateModalOpen(false);
    setNewCategory({ name: "", description: "" });
  };

  const handleEditCategory = (category: Category) => {
    setCategoryToUpdate({
      id: category._id,
      name: category.name,
      description: category.description,
    });
    setIsUpdateModalOpen(true);
  };

  const handleUpdateModalClose = () => {
    setIsUpdateModalOpen(false);
    setCategoryToUpdate({ id: "", name: "", description: "" });
  };

  const handleDeleteCategory = (category: Category) => {
    setDeleteCategory({ id: category._id, name: category.name });
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteDialogClose = () => {
    setIsDeleteDialogOpen(false);
    setDeleteCategory(null);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCategories(categories.map((cat) => cat._id));
    } else {
      setSelectedCategories([]);
    }
  };

  const handleSelectCategory = (categoryId: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories((prev) => [...prev, categoryId]);
    } else {
      setSelectedCategories((prev) => prev.filter((id) => id !== categoryId));
    }
  };

  const isAllSelected =
    categories.length > 0 && selectedCategories.length === categories.length;
  const isIndeterminate =
    selectedCategories.length > 0 &&
    selectedCategories.length < categories.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Categories Management
          </h1>
          <p className="text-muted-foreground">
            Manage expense and transaction categories
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            Total: {pagination.totalItems} categories
          </Badge>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
          {selectedCategories.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsBulkDeleteDialogOpen(true)}
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Selected ({selectedCategories.length})
            </Button>
          )}
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Category</DialogTitle>
                <DialogDescription>
                  Add a new category for organizing expenses and transactions.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Education, Food, Transportation"
                    value={newCategory.name}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, name: e.target.value })
                    }
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="e.g., Tuition fee, School supplies, Educational materials"
                    value={newCategory.description}
                    onChange={(e) =>
                      setNewCategory({
                        ...newCategory,
                        description: e.target.value,
                      })
                    }
                    disabled={isCreating}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={handleCreateModalClose}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button onClick={createCategory} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Category
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Category</DialogTitle>
                <DialogDescription>
                  Modify the category information below.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="update-name">Category Name *</Label>
                  <Input
                    id="update-name"
                    placeholder="e.g., Education, Food, Transportation"
                    value={categoryToUpdate.name}
                    onChange={(e) =>
                      setCategoryToUpdate({
                        ...categoryToUpdate,
                        name: e.target.value,
                      })
                    }
                    disabled={isUpdating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="update-description">Description *</Label>
                  <Textarea
                    id="update-description"
                    placeholder="e.g., Tuition fee, School supplies, Educational materials"
                    value={categoryToUpdate.description}
                    onChange={(e) =>
                      setCategoryToUpdate({
                        ...categoryToUpdate,
                        description: e.target.value,
                      })
                    }
                    disabled={isUpdating}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={handleUpdateModalClose}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdateCategory} disabled={isUpdating}>
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Edit className="mr-2 h-4 w-4" />
                      Update Category
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Categories
            </CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.totalItems}</div>
            <p className="text-xs text-muted-foreground">
              Available categories
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Names</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(categories.map((cat) => cat.name.toLowerCase())).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Distinct category names
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recent Categories
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                categories.filter((cat) => {
                  const createdAt = new Date(cat.createdAt);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return createdAt > weekAgo;
                }).length
              }
            </div>
            <p className="text-xs text-muted-foreground">Created this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Common</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categories.length > 0
                ? Object.entries(
                    categories.reduce((acc, cat) => {
                      acc[cat.name] = (acc[cat.name] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A"
                : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              Most frequent category
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>
            Find specific categories by name or description
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
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

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Categories List</CardTitle>
          <CardDescription>
            Page {currentPage} of {pagination.totalPages} (
            {pagination.totalItems} total categories)
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
                    <TableHead className="w-12">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all categories"
                      />
                    </TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category._id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedCategories.includes(category._id)}
                          onCheckedChange={(checked) =>
                            handleSelectCategory(
                              category._id,
                              checked as boolean
                            )
                          }
                          aria-label={`Select ${category.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <FolderOpen className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{category.name}</div>
                            <Badge variant="outline" className="text-xs">
                              Category
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm">{category.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDate(category.createdAt)}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(category.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDate(category.updatedAt)}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(category.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-xs text-muted-foreground">
                          {category._id.slice(-8)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <CategoryActions
                          category={category}
                          onEdit={handleEditCategory}
                          onDelete={handleDeleteCategory}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {categories.length === 0 && !loading && (
                <div className="text-center py-8">
                  <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No categories found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm
                      ? "No categories match your search criteria."
                      : "Get started by creating your first category."}
                  </p>
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * pageSize + 1} to{" "}
                    {Math.min(currentPage * pageSize, pagination.totalItems)} of{" "}
                    {pagination.totalItems} categories
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
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete Category
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to delete this category? This action
                cannot be undone.
              </p>
              {deleteCategory && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="font-medium">Category Details:</p>
                  <p className="text-sm">Name: {deleteCategory.name}</p>
                  <p className="text-sm">ID: {deleteCategory.id}</p>
                </div>
              )}
              <p className="text-destructive font-medium">
                ⚠️ This will permanently delete the category and may affect
                related transactions.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteCategoryById}
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
                  Delete Category
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={isBulkDeleteDialogOpen}
        onOpenChange={setIsBulkDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete Selected Categories
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to delete {selectedCategories.length}{" "}
                selected{" "}
                {selectedCategories.length === 1 ? "category" : "categories"}?
                This action cannot be undone.
              </p>
              <div className="bg-muted p-3 rounded-md max-h-32 overflow-y-auto">
                <p className="font-medium mb-2">Categories to be deleted:</p>
                {categories
                  .filter((cat) => selectedCategories.includes(cat._id))
                  .map((cat) => (
                    <p key={cat._id} className="text-sm">
                      • {cat.name}
                    </p>
                  ))}
              </div>
              <p className="text-destructive font-medium">
                ⚠️ This will permanently delete the selected categories and may
                affect related transactions.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteSelected}
              disabled={isBulkDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isBulkDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete {selectedCategories.length}{" "}
                  {selectedCategories.length === 1 ? "Category" : "Categories"}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
