"use server"

import { revalidatePath } from "next/cache"
import { insforge } from "@/lib/insforge"
import { profileFormSchema, ProfileFormValues } from "@/lib/validations/profile"
import { calculateProfileCompletion } from "@/lib/utils/profile-completion"

export async function saveProfile(data: ProfileFormValues) {
  try {
    // 1. Validate incoming data
    const validatedData = profileFormSchema.parse(data)

    // 2. Get current authenticated user
    const { data: { user }, error: authError } = await insforge.auth.getCurrentUser()
    
    if (authError || !user) {
      return { success: false, error: "Unauthorized. Please log in again." }
    }

    // 3. Calculate completion status
    const { isComplete } = calculateProfileCompletion(validatedData)

    // 4. Upsert profile into the database
    const { error: updateError } = await insforge.database
      .from('profiles')
      .upsert({
        id: user.id,
        ...validatedData,
        is_complete: isComplete,
        updated_at: new Date().toISOString()
      })

    if (updateError) {
      console.error("Database error saving profile:", updateError)
      return { success: false, error: "Failed to save profile. Please try again." }
    }

    // 5. Revalidate the profile page to show updated data
    revalidatePath("/profile")
    
    return { success: true }
  } catch (error) {
    console.error("Profile save action error:", error)
    return { success: false, error: "An unexpected error occurred while saving." }
  }
}
