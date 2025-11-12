import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db/drizzle";
import { customers } from "../../../../../drizzle/schema";
import { desc } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export default async function AllCustomersDebugPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/auth/sign-in");
  }

  const allCustomers = await db
    .select()
    .from(customers)
    .orderBy(desc(customers.id));

  const activeCustomers = allCustomers.filter(c => c.isActive === true);
  const inactiveCustomers = allCustomers.filter(c => c.isActive === false || c.isActive === null);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>All ISOs (Customers) - Debug View</h1>
      
      <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <h2>Summary</h2>
        <p><strong>Total ISOs:</strong> {allCustomers.length}</p>
        <p><strong>Active ISOs:</strong> {activeCustomers.length}</p>
        <p><strong>Inactive/Hidden ISOs:</strong> {inactiveCustomers.length}</p>
      </div>

      {inactiveCustomers.length > 0 && (
        <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
          <h2>⚠️ Hidden ISOs (isActive = false or null)</h2>
          <ul>
            {inactiveCustomers.map(iso => (
              <li key={iso.id}>
                <strong>ID:</strong> {iso.id} | <strong>Name:</strong> {iso.name || '(no name)'} | <strong>Slug:</strong> {iso.slug} | <strong>isActive:</strong> {String(iso.isActive)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginBottom: '30px' }}>
        <h2>Active ISOs (Visible in UI)</h2>
        <ul>
          {activeCustomers.map(iso => (
            <li key={iso.id}>
              <strong>ID:</strong> {iso.id} | <strong>Name:</strong> {iso.name || '(no name)'} | <strong>Slug:</strong> {iso.slug}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ marginTop: '40px', padding: '15px', backgroundColor: '#f8d7da', borderRadius: '5px' }}>
        <p><strong>⚠️ TEMPORARY DEBUG PAGE</strong> - This page should be removed after verification</p>
      </div>
    </div>
  );
}
