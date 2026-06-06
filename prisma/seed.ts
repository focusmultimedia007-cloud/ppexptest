import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@happypunjab.com" },
    update: {},
    create: {
      email: "admin@happypunjab.com",
      name: "Admin User",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("Created admin:", admin.email);

  // Create staff user
  const staffPassword = await bcrypt.hash("staff123", 12);
  const staff = await prisma.user.upsert({
    where: { email: "staff@happypunjab.com" },
    update: {},
    create: {
      email: "staff@happypunjab.com",
      name: "Staff User",
      password: staffPassword,
      role: "STAFF",
    },
  });
  console.log("Created staff:", staff.email);

  // Create categories
  const categories = [
    "Non Veg",
    "Vegetables",
    "Dairy",
    "Dry Goods",
    "Spices",
    "Beverages",
    "Packaging",
    "Breads & Flour",
    "Oils & Fats",
    "Condiments",
  ];

  const categoryMap: Record<string, string> = {};
  for (const name of categories) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categoryMap[name] = cat.id;
    console.log(`Created category: ${name}`);
  }

  // Create suppliers
  const suppliers = [
    { name: "Punjab Fresh Farms", phone: "+91 98765 43210", email: "contact@punjabfresh.com", address: "Sector 12, Chandigarh" },
    { name: "Delhi Meat House", phone: "+91 87654 32109", email: "orders@delhimeat.com", address: "Chandni Chowk, Delhi" },
    { name: "Amul Dairy Distributor", phone: "+91 76543 21098", email: "amul@dist.com", address: "Gujarat" },
    { name: "Rajdhani Spices", phone: "+91 65432 10987", email: "spices@rajdhani.com", address: "Khari Baoli, Delhi" },
  ];

  const supplierMap: Record<string, string> = {};
  for (const s of suppliers) {
    const supplier = await prisma.supplier.upsert({
      where:  { name: s.name },
      update: { phone: s.phone, email: s.email, address: s.address },
      create: s,
    });
    supplierMap[s.name] = supplier.id;
    console.log(`Created supplier: ${s.name}`);
  }

  // Create inventory items
  const items = [
    // Non Veg
    { name: "Chicken (Whole)", categoryId: categoryMap["Non Veg"], unit: "kg", minStockLevel: 10, currentStock: 50, purchasePrice: 180, supplierId: supplierMap["Delhi Meat House"] },
    { name: "Chicken Breast", categoryId: categoryMap["Non Veg"], unit: "kg", minStockLevel: 5, currentStock: 25, purchasePrice: 250, supplierId: supplierMap["Delhi Meat House"] },
    { name: "Mutton (Bone-in)", categoryId: categoryMap["Non Veg"], unit: "kg", minStockLevel: 8, currentStock: 30, purchasePrice: 550, supplierId: supplierMap["Delhi Meat House"] },
    { name: "Fish (Rohu)", categoryId: categoryMap["Non Veg"], unit: "kg", minStockLevel: 5, currentStock: 15, purchasePrice: 200 },
    { name: "Prawns", categoryId: categoryMap["Non Veg"], unit: "kg", minStockLevel: 3, currentStock: 8, purchasePrice: 450 },
    { name: "Eggs", categoryId: categoryMap["Non Veg"], unit: "dozen", minStockLevel: 5, currentStock: 20, purchasePrice: 75 },

    // Vegetables
    { name: "Onions", categoryId: categoryMap["Vegetables"], unit: "kg", minStockLevel: 10, currentStock: 40, purchasePrice: 30, supplierId: supplierMap["Punjab Fresh Farms"] },
    { name: "Tomatoes", categoryId: categoryMap["Vegetables"], unit: "kg", minStockLevel: 8, currentStock: 25, purchasePrice: 40, supplierId: supplierMap["Punjab Fresh Farms"] },
    { name: "Ginger", categoryId: categoryMap["Vegetables"], unit: "kg", minStockLevel: 2, currentStock: 5, purchasePrice: 120 },
    { name: "Garlic", categoryId: categoryMap["Vegetables"], unit: "kg", minStockLevel: 2, currentStock: 5, purchasePrice: 100 },
    { name: "Green Chillies", categoryId: categoryMap["Vegetables"], unit: "kg", minStockLevel: 1, currentStock: 3, purchasePrice: 80 },
    { name: "Capsicum", categoryId: categoryMap["Vegetables"], unit: "kg", minStockLevel: 2, currentStock: 6, purchasePrice: 60 },
    { name: "Potatoes", categoryId: categoryMap["Vegetables"], unit: "kg", minStockLevel: 10, currentStock: 35, purchasePrice: 25 },
    { name: "Cauliflower", categoryId: categoryMap["Vegetables"], unit: "kg", minStockLevel: 3, currentStock: 8, purchasePrice: 35 },
    { name: "Spinach", categoryId: categoryMap["Vegetables"], unit: "kg", minStockLevel: 2, currentStock: 4, purchasePrice: 30 },
    { name: "Peas (Frozen)", categoryId: categoryMap["Vegetables"], unit: "kg", minStockLevel: 3, currentStock: 10, purchasePrice: 55 },

    // Dairy
    { name: "Full Cream Milk", categoryId: categoryMap["Dairy"], unit: "L", minStockLevel: 20, currentStock: 50, purchasePrice: 60, supplierId: supplierMap["Amul Dairy Distributor"] },
    { name: "Cream (Fresh)", categoryId: categoryMap["Dairy"], unit: "L", minStockLevel: 3, currentStock: 8, purchasePrice: 200 },
    { name: "Paneer", categoryId: categoryMap["Dairy"], unit: "kg", minStockLevel: 5, currentStock: 15, purchasePrice: 280, supplierId: supplierMap["Amul Dairy Distributor"] },
    { name: "Butter (Salted)", categoryId: categoryMap["Dairy"], unit: "kg", minStockLevel: 2, currentStock: 5, purchasePrice: 450 },
    { name: "Ghee (Pure)", categoryId: categoryMap["Dairy"], unit: "L", minStockLevel: 2, currentStock: 8, purchasePrice: 600 },
    { name: "Curd/Yogurt", categoryId: categoryMap["Dairy"], unit: "kg", minStockLevel: 5, currentStock: 12, purchasePrice: 60 },

    // Dry Goods
    { name: "Basmati Rice (Premium)", categoryId: categoryMap["Dry Goods"], unit: "kg", minStockLevel: 20, currentStock: 80, purchasePrice: 90 },
    { name: "Wheat Flour (Atta)", categoryId: categoryMap["Dry Goods"], unit: "kg", minStockLevel: 15, currentStock: 50, purchasePrice: 35 },
    { name: "Maida (All Purpose Flour)", categoryId: categoryMap["Dry Goods"], unit: "kg", minStockLevel: 5, currentStock: 20, purchasePrice: 40 },
    { name: "Lentils (Dal Makhani)", categoryId: categoryMap["Dry Goods"], unit: "kg", minStockLevel: 5, currentStock: 15, purchasePrice: 120 },
    { name: "Chickpeas (Chana)", categoryId: categoryMap["Dry Goods"], unit: "kg", minStockLevel: 5, currentStock: 12, purchasePrice: 100 },
    { name: "Sugar", categoryId: categoryMap["Dry Goods"], unit: "kg", minStockLevel: 5, currentStock: 20, purchasePrice: 45 },
    { name: "Salt", categoryId: categoryMap["Dry Goods"], unit: "kg", minStockLevel: 3, currentStock: 10, purchasePrice: 20 },

    // Spices
    { name: "Cumin Seeds (Jeera)", categoryId: categoryMap["Spices"], unit: "kg", minStockLevel: 0.5, currentStock: 2, purchasePrice: 250, supplierId: supplierMap["Rajdhani Spices"] },
    { name: "Coriander Powder", categoryId: categoryMap["Spices"], unit: "kg", minStockLevel: 0.5, currentStock: 2, purchasePrice: 180, supplierId: supplierMap["Rajdhani Spices"] },
    { name: "Turmeric Powder", categoryId: categoryMap["Spices"], unit: "kg", minStockLevel: 0.5, currentStock: 1.5, purchasePrice: 200 },
    { name: "Garam Masala", categoryId: categoryMap["Spices"], unit: "kg", minStockLevel: 0.5, currentStock: 1, purchasePrice: 400 },
    { name: "Red Chilli Powder", categoryId: categoryMap["Spices"], unit: "kg", minStockLevel: 0.5, currentStock: 2, purchasePrice: 220 },
    { name: "Tandoori Masala", categoryId: categoryMap["Spices"], unit: "kg", minStockLevel: 0.5, currentStock: 1.5, purchasePrice: 300 },

    // Beverages
    { name: "Mango Pulp", categoryId: categoryMap["Beverages"], unit: "kg", minStockLevel: 5, currentStock: 15, purchasePrice: 80 },
    { name: "Rose Syrup", categoryId: categoryMap["Beverages"], unit: "L", minStockLevel: 2, currentStock: 5, purchasePrice: 120 },
    { name: "Mineral Water Bottles", categoryId: categoryMap["Beverages"], unit: "pcs", minStockLevel: 50, currentStock: 200, purchasePrice: 15 },

    // Oils
    { name: "Cooking Oil (Sunflower)", categoryId: categoryMap["Oils & Fats"], unit: "L", minStockLevel: 10, currentStock: 30, purchasePrice: 130 },
    { name: "Mustard Oil", categoryId: categoryMap["Oils & Fats"], unit: "L", minStockLevel: 5, currentStock: 15, purchasePrice: 160 },
  ];

  for (const item of items) {
    await prisma.inventoryItem.create({ data: item });
    console.log(`Created item: ${item.name}`);
  }

  console.log("\nDatabase seeded successfully!");
  console.log("\nLogin credentials:");
  console.log("Admin: admin@happypunjab.com / admin123");
  console.log("Staff: staff@happypunjab.com / staff123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
