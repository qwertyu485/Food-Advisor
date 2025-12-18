import { Header, PageTitle } from "@/components/Header";

const TEAM = [
  { initial: "K", name: "Katie Zhang", role: "UI Designer", color: "bg-gray-400" },
  { initial: "X", name: "Xinci Chen", role: "Data Analyst", color: "bg-[#FF8A00]" },
  { initial: "R", name: "Ruiting Cao", role: "UX Writer", color: "bg-[#005EA6]" },
  { initial: "J", name: "Joan Bolanos Martinez", role: "Project Support", color: "bg-[#005F4B]" },
];

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <PageTitle title="About Us" />

      <main className="flex-1 container mx-auto px-6 py-12 max-w-4xl">
        <section className="mb-16 space-y-6">
          <h2 className="text-2xl font-bold text-foreground">About FoodAdvisor</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            FoodAdvisor is a simple nutrition assistant designed to help users quickly check food calories and understand nutritional values.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed">
            By using the USDA FoodData Central API, our web app transforms complex nutrition data into clear, actionable insights that support healthier daily choices.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed">
            We aim to make healthy eating easier by turning complex nutrition data into clear, friendly guidance. Whether you want to track daily intake, learn more about ingredients, or make smarter food choices, FoodAdvisor is here to support your healthy lifestyle.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-10">About Our Team</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {TEAM.map((member) => (
              <div key={member.name} className="flex flex-col items-center text-center group">
                <div className={`w-24 h-24 md:w-32 md:h-32 rounded-full ${member.color} flex items-center justify-center text-white text-4xl font-bold mb-4 shadow-lg transform group-hover:scale-105 transition-transform duration-300`}>
                  {member.initial}
                </div>
                <h3 className="font-bold text-lg italic">{member.name}</h3>
                <p className="text-sm text-muted-foreground italic">{member.role}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
