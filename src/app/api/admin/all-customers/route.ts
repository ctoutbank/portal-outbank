import { NextResponse } from "next/server";
import { getAllCustomersIncludingInactive } from "@/features/customers/server/customers";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const allCustomers = await getAllCustomersIncludingInactive();
    
    return NextResponse.json({
      customers: allCustomers,
      total: allCustomers.length,
      active: allCustomers.filter(c => c.isActive === true).length,
      inactive: allCustomers.filter(c => c.isActive === false || c.isActive === null).length,
    });
  } catch (error) {
    console.error("Error fetching all customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}
