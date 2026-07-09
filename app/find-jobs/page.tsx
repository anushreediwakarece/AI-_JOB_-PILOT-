"use client"

import * as React from "react"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { SearchControls } from "@/components/find-jobs/SearchControls"
import { JobsList } from "@/components/find-jobs/JobsList"

export default function FindJobs() {
  const [refreshCounter, setRefreshCounter] = React.useState(0)
  const [hasSearched, setHasSearched] = React.useState(false)

  const handleSearchComplete = () => {
    setHasSearched(true)
    setRefreshCounter(c => c + 1)
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col w-full min-h-[calc(100vh-140px)] px-6 py-12 max-w-[1040px] mx-auto gap-8">
        <SearchControls onSearchComplete={handleSearchComplete} />
        {hasSearched && <JobsList refreshTrigger={refreshCounter} />}
      </main>
      <Footer />
    </>
  )
}
