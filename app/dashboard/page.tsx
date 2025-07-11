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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Users,
  Activity,
  TrendingUp,
  DollarSign,
  Clock,
  Shield,
  Trash2,
  LogIn,
  LogOut,
} from "lucide-react";
import {
  getStoredAdminInfo,
  makeAuthenticatedRequest,
  type AdminInfo,
} from "@/lib/auth";
import { formatDistanceToNow } from "@/lib/date-utils";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface DashboardActivity {
  _id: string;
  action: "login" | "logout" | "delete" | "update";
  adminId: string;
  details: Record<string, any>;
  createdAt: string;
}

interface DashboardData {
  userCount: number;
  groupCount: number;
  billCount: number;
  shoppingListCount: number;
  transactionCount: number;
  recentActivities: DashboardActivity[];
}

interface DashboardResponse {
  message: string;
  status: number;
  data: DashboardData;
}

export default function DashboardPage() {
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      // Fetch project usage statistics
      const usageResponse = await makeAuthenticatedRequest(
        "https://fairsplit-server.onrender.com/api/v1/admin/project/usage"
      );

      if (!usageResponse.ok) {
        throw new Error("Failed to fetch project usage");
      }

      const usageData = await usageResponse.json();

      // Fetch admin activities (keep existing endpoint)
      const activitiesResponse = await makeAuthenticatedRequest(
        "https://fairsplit-server.onrender.com/api/v1/admin"
      );

      let activitiesData = { data: { recentActivities: [] } };
      if (activitiesResponse.ok) {
        activitiesData = await activitiesResponse.json();
      }

      if (usageData.status === 200) {
        setDashboardData({
          ...usageData.data,
          recentActivities: activitiesData.data?.recentActivities || [],
        });
      } else {
        setError(usageData.message || "Failed to fetch dashboard data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setAdminInfo(getStoredAdminInfo());
    fetchDashboardData();
  }, []);

  // Prepare chart data
  const getActivityTypeData = () => {
    if (!dashboardData) return [];

    const activityCounts = dashboardData.recentActivities.reduce(
      (acc, activity) => {
        acc[activity.action] = (acc[activity.action] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(activityCounts).map(([action, count]) => ({
      name: action.charAt(0).toUpperCase() + action.slice(1),
      value: count,
      action,
    }));
  };

  const getActivityTimelineData = () => {
    if (!dashboardData) return [];

    // Group activities by date
    const activityByDate = dashboardData.recentActivities.reduce(
      (acc, activity) => {
        const date = new Date(activity.createdAt).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(activityByDate)
      .map(([date, count]) => ({
        date,
        activities: count,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7); // Last 7 days
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "login":
        return <LogIn className="h-4 w-4 text-green-600" />;
      case "logout":
        return <LogOut className="h-4 w-4 text-blue-600" />;
      case "delete":
        return <Trash2 className="h-4 w-4 text-red-600" />;
      case "update":
        return <Shield className="h-4 w-4 text-yellow-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "login":
        return "text-green-600";
      case "logout":
        return "text-blue-600";
      case "delete":
        return "text-red-600";
      case "update":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {adminInfo?.email}
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {adminInfo?.role}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.userCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.groupCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">Active groups</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.billCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">Bills created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Shopping Lists
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.shoppingListCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">Shopping lists</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.transactionCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">Total transactions</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Activity Timeline Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
            <CardDescription>
              Admin activities over the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                activities: {
                  label: "Activities",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getActivityTimelineData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="activities"
                    stroke="var(--color-activities)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Activity Types Chart */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Activity Types</CardTitle>
            <CardDescription>Distribution of admin actions</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                login: {
                  label: "Login",
                  color: "hsl(var(--chart-1))",
                },
                logout: {
                  label: "Logout",
                  color: "hsl(var(--chart-2))",
                },
                delete: {
                  label: "Delete",
                  color: "hsl(var(--chart-3))",
                },
                update: {
                  label: "Update",
                  color: "hsl(var(--chart-4))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getActivityTypeData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getActivityTypeData().map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>
            Latest admin actions and system events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData?.recentActivities.slice(0, 10).map((activity) => (
              <div
                key={activity._id}
                className="flex items-center space-x-4 p-3 border rounded-lg"
              >
                <div className="flex-shrink-0">
                  {getActionIcon(activity.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`font-medium ${getActionColor(
                        activity.action
                      )}`}
                    >
                      {activity.action.charAt(0).toUpperCase() +
                        activity.action.slice(1)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {activity.adminId.slice(-8)}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {activity.action === "login" &&
                      `Login via ${activity.details.method}`}
                    {activity.action === "logout" &&
                      `Logout via ${activity.details.method}`}
                    {activity.action === "delete" &&
                      `Deleted user ${activity.details.userId?.slice(-8)}`}
                    {activity.action === "update" &&
                      `Updated user verification to ${activity.details.verify}`}
                  </div>
                </div>
                <div className="flex-shrink-0 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3 inline mr-1" />
                  {formatDistanceToNow(new Date(activity.createdAt), {
                    addSuffix: true,
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Summary Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Summary</CardTitle>
          <CardDescription>Count of different admin actions</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              count: {
                label: "Count",
                color: "hsl(var(--chart-1))",
              },
            }}
            className="h-[200px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getActivityTypeData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="var(--color-count)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
