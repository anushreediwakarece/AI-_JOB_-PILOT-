import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { Card } from "@/components/ui/Card"
import { StatsBar } from "@/components/dashboard/StatsBar"
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed"
import { CompanyResearchChart } from "@/components/dashboard/CompanyResearchChart"
import { JobsOverTimeChart } from "@/components/dashboard/JobsOverTimeChart"
import { MatchDistributionChart } from "@/components/dashboard/MatchDistributionChart"

export default function Dashboard() {
  return (
    <>
      <Navbar />
      <main className="flex-1 w-full bg-background min-h-[calc(100vh-140px)]">
        <div className="w-full max-w-[1360px] mx-auto px-6 py-10 flex flex-col gap-6">
          {/* Stat cards — real data (feature 15) */}
          <StatsBar />

          {/* Recent Activity | Company Research Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h2 className="text-lg font-bold text-text-primary mb-6">Recent Activity</h2>
              <RecentActivityFeed />
            </Card>
            <Card className="flex flex-col">
              <h2 className="text-lg font-bold text-text-primary mb-4">Company Research Activity</h2>
              <div className="flex-1 flex items-center">
                <CompanyResearchChart />
              </div>
            </Card>
          </div>

          {/* Jobs Found Over Time (2/3) | Match Score Distribution (1/3) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 flex flex-col">
              <h2 className="text-lg font-bold text-text-primary mb-4">Jobs Found Over Time</h2>
              <div className="flex-1 flex items-center">
                <JobsOverTimeChart />
              </div>
            </Card>
            <Card className="flex flex-col">
              <h2 className="text-lg font-bold text-text-primary mb-4">Match Score Distribution</h2>
              <div className="flex-1 flex items-center">
                <MatchDistributionChart />
              </div>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
