import { prisma } from "@/lib/prisma";
import { updateRestaurantConfig } from "./actions";
import { Store, Palette, Save } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const config = await prisma.restaurantConfig.findUnique({
    where: { id: "default" },
  });

  return (
    <main className="min-h-screen bg-slate-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Live Preview Card */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <header className="p-6 bg-brand-secondary text-white flex justify-between items-center transition-colors">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{config?.name}</h1>
              <p className="text-sm opacity-80">{config?.tagline}</p>
            </div>
            <div className="px-3 py-1 bg-brand-primary text-white text-xs font-semibold rounded-full shadow-sm">
              Live Preview
            </div>
          </header>

          <div className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Featured Quick Order</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 border rounded-xl flex justify-between items-center bg-slate-50">
                <div>
                  <p className="font-medium text-slate-900">Classic Burger</p>
                  <p className="text-sm text-slate-500">{config?.currency} 149</p>
                </div>
                <button className="px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition">
                  Order Now
                </button>
              </div>
              <div className="p-4 border rounded-xl flex justify-between items-center bg-slate-50">
                <div>
                  <p className="font-medium text-slate-900">Paneer Tikka Roll</p>
                  <p className="text-sm text-slate-500">{config?.currency} 199</p>
                </div>
                <button className="px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition">
                  Order Now
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Customization Form */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6">
            <Palette className="w-5 h-5 text-slate-700" />
            <h2 className="text-xl font-bold text-slate-800">Restaurant Customization Engine</h2>
          </div>

          <form action={updateRestaurantConfig} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Restaurant Name</label>
              <input
                type="text"
                name="name"
                defaultValue={config?.name}
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tagline</label>
              <input
                type="text"
                name="tagline"
                defaultValue={config?.tagline}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Currency Symbol</label>
              <input
                type="text"
                name="currency"
                defaultValue={config?.currency}
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Primary Color</label>
                <input
                  type="color"
                  name="primaryColor"
                  defaultValue={config?.primaryColor}
                  className="w-full h-10 p-1 border rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Secondary Color</label>
                <input
                  type="color"
                  name="secondaryColor"
                  defaultValue={config?.secondaryColor}
                  className="w-full h-10 p-1 border rounded-lg cursor-pointer"
                />
              </div>
            </div>

            <div className="md:col-span-2 pt-2">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition"
              >
                <Save className="w-4 h-4" /> Save & Apply Customization
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
