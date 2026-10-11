"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateRestaurantConfig(formData: FormData) {
  const name = formData.get("name") as string;
  const tagline = formData.get("tagline") as string;
  const primaryColor = formData.get("primaryColor") as string;
  const secondaryColor = formData.get("secondaryColor") as string;
  const currency = formData.get("currency") as string;

  await prisma.restaurantConfig.upsert({
    where: { id: "default" },
    update: { name, tagline, primaryColor, secondaryColor, currency },
    create: { id: "default", name, tagline, primaryColor, secondaryColor, currency },
  });

  revalidatePath("/");
}
