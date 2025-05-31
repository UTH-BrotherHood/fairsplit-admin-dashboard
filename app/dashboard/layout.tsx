"use client";

import type React from "react";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthGuard } from "@/components/auth-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1">
          <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center px-4">
              <SidebarTrigger />
              <div className="ml-auto flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">
                  Admin Dashboard
                </span>
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">{children}</div>
        </main>
      </SidebarProvider>
    </AuthGuard>
  );
}
