"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/supabase/auth-helpers";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { createInvitation } from "@/lib/supabase/invitation-helpers";
import { UserPlus, Trash2 } from "lucide-react";

interface User {
  id: string;
  full_name: string;
  email: string;
  role: "admin" | "employee";
  status?: "active" | "inactive";
}

interface Invitation {
  id: string;
  email: string;
  status: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "employee">(
    "employee"
  );
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkDarkMode = () => {
      setDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  const fetchData = async () => {
    try {
      const user = await getCurrentUser();
      if (!user || user.role !== "admin") {
        router.push("/auth/login");
        return;
      }
      setCurrentUser(user);

      // Fetch only active users (filter out inactive/deleted users)
      const { data, error } = await supabase.from("users").select("*");
      if (error) throw error;
      
      // Filter to show only active users (or users without status for backward compatibility)
      const activeUsers = (data as User[]).filter(user => !user.status || user.status === 'active');
      setUsers(activeUsers);

      // Fetch all invitations
      const { data: invitationsData, error: invError } = await supabase
        .from("invitations")
        .select("*")
        .order("created_at", { ascending: false });

      if (invError) throw invError;
      setInvitations(invitationsData as Invitation[]);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInviteSuccess(false);

    if (!currentUser) {
      setError("You must be logged in to send invitations.");
      setLoading(false);
      return;
    }

    try {
      await createInvitation(inviteEmail, currentUser.id, inviteRole);
      setLoading(false);
      setInviteSuccess(true);
      setInviteEmail("");
      setInviteRole("employee");
      
      // Close dialog after showing success message
      setTimeout(async () => {
        setIsInviteDialogOpen(false);
        setInviteSuccess(false);
        // Refresh data after dialog closes to prevent flicker
        await fetchData();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to send invitation.");
      setLoading(false);
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!confirm("Are you sure you want to revoke this invitation? This will also delete the associated user account if it exists.")) return;
    
    try {
      // First, get the email associated with the invitation
      const { data: invitationToRevoke, error: fetchInvError } = await supabase
        .from("invitations")
        .select("email")
        .eq("id", invitationId)
        .single();

      if (fetchInvError) throw fetchInvError;
      if (!invitationToRevoke) throw new Error("Invitation not found.");

      // Delete the invitation
      console.log("Client: Deleting invitation from Supabase DB:", invitationId);
      const { error: deleteInvError } = await supabase
        .from("invitations")
        .delete()
        .eq("id", invitationId);

      if (deleteInvError) {
        console.error("Client: Error deleting invitation from DB:", deleteInvError);
        throw deleteInvError;
      }
      console.log("Client: Invitation deleted from DB. Proceeding to delete user account.");

      // Prepare and log the payload for the API route
      const deleteUserPayload = { email: invitationToRevoke.email };
      console.log("Client: Sending delete user API request with payload:", deleteUserPayload);

      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      // Attempt to delete the associated user account using the API route
      const response = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(deleteUserPayload),
      });

      if (!response.ok) {
        // Log the raw response if it's not OK, to help debug JSON parsing issues
        const errorText = await response.text();
        console.error("Client: Delete user API responded with an error status:", response.status, errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (parseError) {
          console.error("Client: Failed to parse error response as JSON:", parseError);
          throw new Error(`API Error: ${errorText || "Unknown error (failed to parse response)"}`);
        }
        throw new Error(errorData.error || "Failed to delete user account.");
      }

      // Refresh both user and invitation lists
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to revoke invitation or delete user.");
      console.error("Error revoking invitation or deleting user:", err);
    }
  };

  const handleRoleChange = async (
    userId: string,
    newRole: "admin" | "employee"
  ) => {
    setLoading(true);
    try {
      const { error: updateTableError } = await supabase
        .from("users")
        .update({ role: newRole })
        .eq("id", userId);

      if (updateTableError) throw updateTableError;

      // Also update the user_metadata if the current user's role is being changed
      if (userId === currentUser.id) {
        const {
          data: { user: updatedAuthUser },
          error: updateAuthError,
        } = await supabase.auth.updateUser({
          data: { role: newRole },
        });

        if (updateAuthError) throw updateAuthError;
        setCurrentUser(updatedAuthUser); // Update the currentUser state
      }

      // Refresh all data after role change
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to update user role.");
      console.error("Error updating user role:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      // Call the API route to delete the user
      const response = await fetch("/api/padmin/delete-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ email: userEmail }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (parseError) {
          throw new Error(`API Error: ${errorText || "Unknown error"}`);
        }
        throw new Error(errorData.error || "Failed to delete user account.");
      }

      // Refresh the user list
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to delete user.");
      console.error("Error deleting user:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className={`flex justify-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
          <span className="text-4xl animate-[bounce_1s_ease-in-out_0s_infinite]">.</span>
          <span className="text-4xl animate-[bounce_1s_ease-in-out_0.2s_infinite]">.</span>
          <span className="text-4xl animate-[bounce_1s_ease-in-out_0.4s_infinite]">.</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "admin") {
    return null; // Should redirect to login in useEffect
  }

  return (
    <div className="p-3 md:p-6">
      <Card className={`${darkMode ? 'bg-black border-gray-800' : 'bg-white border-blue-100'} shadow-sm`}>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 md:p-6">
          <div>
            <CardTitle className={`text-xl md:text-2xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>User Management</CardTitle>
            <p className={`text-xs md:text-sm ${darkMode ? 'text-gray-400' : 'text-black'} mt-1`}>Manage users and send invitations</p>
          </div>
          <Dialog
            open={isInviteDialogOpen}
            onOpenChange={setIsInviteDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white text-sm w-full sm:w-auto">
                <UserPlus size={16} className="mr-2" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent className={`sm:max-w-[425px] max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <DialogHeader>
                <DialogTitle className={darkMode ? 'text-white' : 'text-gray-900'}>Invite New User</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleInviteUser} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="email" className={darkMode ? 'text-gray-200' : 'text-gray-900'}>Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className={darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-400' : 'bg-white border-gray-300 text-gray-900'}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role" className={darkMode ? 'text-gray-200' : 'text-gray-900'}>Role</Label>
                  <Select
                    value={inviteRole}
                    onValueChange={(value: "admin" | "employee") =>
                      setInviteRole(value)
                    }
                  >
                    <SelectTrigger className={darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}>
                      <SelectItem value="employee" className={darkMode ? 'text-white hover:bg-gray-700' : 'text-gray-900'}>Employee</SelectItem>
                      <SelectItem value="admin" className={darkMode ? 'text-white hover:bg-gray-700' : 'text-gray-900'}>Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                {inviteSuccess && (
                  <p className="text-green-500 text-sm">
                    Invitation sent successfully!
                  </p>
                )}
                <Button 
                  type="submit" 
                  disabled={loading}
                  className={darkMode ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-gray-900 hover:bg-gray-800 text-white'}
                >
                  {loading ? "Sending..." : "Send Invitation"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0 md:p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className={`border-b-2 ${darkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                  <TableHead className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>Full Name</TableHead>
                  <TableHead className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>Email</TableHead>
                  <TableHead className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>Role</TableHead>
                  <TableHead className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className={`border-b ${darkMode ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <TableCell className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-black'}`}>
                      <div className="truncate max-w-[150px] md:max-w-none">{user.full_name}</div>
                    </TableCell>
                    <TableCell className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-black'}`}>
                      <div className="truncate max-w-[150px] md:max-w-none">{user.email}</div>
                    </TableCell>
                    <TableCell className={`text-sm font-medium capitalize ${darkMode ? 'text-gray-300' : 'text-black'}`}>{user.role}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select
                          value={user.role}
                          onValueChange={(value: "admin" | "employee") =>
                            handleRoleChange(user.id, value)
                          }
                          disabled={user.id === currentUser.id} // Prevent changing own role
                        >
                          <SelectTrigger className={`w-[100px] md:w-[140px] text-xs md:text-sm ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-black'}`}>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="employee">Employee</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        {user.id !== currentUser.id && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id, user.email, user.full_name)}
                            className="h-8 w-8 p-0"
                            title="Delete user"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Invitations Section */}
      {invitations.length > 0 && (
        <Card className={`${darkMode ? 'bg-black border-gray-800' : 'bg-white border-blue-100'} shadow-sm mt-4 md:mt-6`}>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className={`text-lg md:text-xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>
              Pending Invitations ({invitations.length})
            </CardTitle>
            <p className={`text-xs md:text-sm ${darkMode ? 'text-gray-400' : 'text-black'} mt-1`}>
              Invitation history and status
            </p>
          </CardHeader>
          <CardContent className="p-0 md:p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className={`border-b-2 ${darkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                    <TableHead className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>Email</TableHead>
                    <TableHead className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>Invited On</TableHead>
                    <TableHead className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>Status</TableHead>
                    <TableHead className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {invitations.map((invitation) => (
                    <TableRow key={invitation.id} className={`border-b ${darkMode ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <TableCell className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-black'}`}>
                        <div className="truncate max-w-[150px] md:max-w-none">{invitation.email}</div>
                      </TableCell>
                      <TableCell className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-black'}`}>
                        {new Date(invitation.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          invitation.status === 'accepted' 
                            ? darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                            : invitation.status === 'pending'
                            ? darkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
                            : darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {invitation.status === 'accepted' ? '✓ Signed Up' : invitation.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleRevokeInvitation(invitation.id)}
                        >
                          {invitation.status === 'accepted' ? 'Delete' : 'Revoke'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
