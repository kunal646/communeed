import { createClient } from "@/utils/supabase/server"
import { AnalyticsClient } from "./clientAnalytics"


type Goal = {
    id: number
    client_id: string
    goal: string
    target: number
    target_duration: 'daily' | 'weekly'
    created_at: string
    updated_at: string
}

type GoalProgress = Goal & {
    progress: number
    percentage: number
}
export default async function AnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()

    // Await the params
    const { id } = await params

    const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('client_id', id)

    // Get date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: assessmentsData, error: assessmentsError } = await supabase
        .from('assessments')
        .select('*')
        .eq('client_id', id)
        .gte('assessment_date', sevenDaysAgo.toISOString())
        .order('assessment_date', { ascending: false })


    // Process goals with assessments data
    const processedGoals: GoalProgress[] = (goalsData || []).map(goal => {
        // Filter assessments based on goal duration
        const relevantAssessments = (assessmentsData || []).filter(assessment => {
            if (goal.target_duration === 'daily') {
                // For daily goals, only consider assessments from the last 24 hours that match the goal
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return new Date(assessment.assessment_date) >= today && assessment.assessment === goal.goal;
            } else {
                // For weekly goals, use all assessments from last 7 days that match the goal
                return assessment.assessment === goal.goal;
            }
        });

        // Count positive outcomes (true values) from assessments
        const positiveOutcomes = relevantAssessments.reduce((sum, assessment) => {
            return sum + (assessment.outcome ? 1 : 0);
        }, 2);

        // Calculate score out of 10 based on ratio of positive outcomes
        const progressScore = relevantAssessments.length > 0
            ? Math.round((positiveOutcomes / (goal.target_duration === 'weekly' ? relevantAssessments.length * 7 : relevantAssessments.length)) * 10)
            : 0;

        // Calculate percentage (score out of 10 converted to percentage)
        const percentage = (progressScore / 10) * 100;

        return {
            ...goal,
            progress: progressScore, // Score out of 10
            percentage: Math.min(100, Math.max(0, percentage)) // Clamp between 0-100
        };
    });
    if (goalsError) {
        console.error('Error fetching goals:', goalsError)
        return null
    }
    // Get general assessments data
    const generalAssessments = ["Positive self-talk", "good mood"];

    // Group assessments by date for each type
    const dailyAssessments = (assessmentsData || []).reduce((acc, assessment) => {
        if (!generalAssessments.includes(assessment.assessment)) return acc;

        // Get date string without time
        const dateStr = new Date(assessment.assessment_date).toISOString().split('T')[0];

        if (!acc[dateStr]) {
            acc[dateStr] = {
                date: dateStr,
                'Positive self-talk': { total: 0, positive: 0 },
                'good mood': { total: 0, positive: 0 }
            };
        }

        // Update counts for the specific assessment type
        acc[dateStr][assessment.assessment].total += 1;
        if (assessment.outcome) {
            acc[dateStr][assessment.assessment].positive += 1;
        }

        return acc;
    }, {} as Record<string, {
        date: string,
        'Positive self-talk': { total: number, positive: number },
        'good mood': { total: number, positive: number }
    }>);

    // Convert to array and calculate percentages
    const dailyStats = Object.values(dailyAssessments as Record<string, {
        date: string,
        'Positive self-talk': { total: number, positive: number },
        'good mood': { total: number, positive: number }
    }>).map(day => ({
        date: day.date,
        'Positive self-talk': day['Positive self-talk'].total > 0
            ? (day['Positive self-talk'].positive / day['Positive self-talk'].total) * 100
            : 0,
        'good mood': day['good mood'].total > 0
            ? (day['good mood'].positive / day['good mood'].total) * 100
            : 0
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Add dailyStats to the data being passed to the client


    return <AnalyticsClient initialGoalsData={processedGoals} dailyStats={dailyStats} />
}