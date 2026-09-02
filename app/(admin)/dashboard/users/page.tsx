import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UsersTable } from "./users-table";

export default function AdminUsersPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Kullanıcılar</CardTitle>
        <CardDescription>Tüm admin, koç ve öğrenci hesaplarını buradan yönet.</CardDescription>
      </CardHeader>
      <CardContent>
        <UsersTable />
      </CardContent>
    </Card>
  );
}
