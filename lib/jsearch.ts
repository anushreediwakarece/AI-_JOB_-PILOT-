export type JSearchJob = {
  job_id: string;
  job_title: string;
  employer_name: string;
  job_city: string;
  job_country: string;
  job_description: string;
  job_apply_link: string;
  job_min_salary: number | null;
  job_max_salary: number | null;
  job_employment_type: string;
  job_posted_at_datetime_utc: string;
};

export async function searchJobs(
  jobTitle: string,
  location: string,
  company?: string,
): Promise<JSearchJob[]> {
  // JSearch takes a natural-language query, so we compose the parts the user
  // provided: "<title> at <company> in <location>".
  let query = jobTitle;
  if (company && company.trim()) query += ` at ${company.trim()}`;
  if (location && location.trim()) query += ` in ${location.trim()}`;
  const params = new URLSearchParams({
    query: query,
    page: "1",
    // Two pages (~20 results) is enough to paginate the list while keeping the
    // JSearch call fast — num_pages:3 roughly triples upstream latency for jobs
    // most users never scroll to.
    num_pages: "2",
  });

  const apiKey = process.env.RAPIDAPI_KEY || "";
  const url = `https://jsearch.p.rapidapi.com/search-v2?${params.toString()}`;
  
  console.log("JSearch request URL:", url);
  console.log("JSearch API key prefix:", apiKey.substring(0, 8) + "...");

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-rapidapi-key": apiKey,
      "x-rapidapi-host": "jsearch.p.rapidapi.com",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("JSearch API failed:", response.status, response.statusText);
    console.error("JSearch response body:", body);
    throw new Error(`JSearch API error: ${response.status} ${response.statusText} — ${body}`);
  }

  const json = await response.json();
  return json.data?.jobs || [];
}
