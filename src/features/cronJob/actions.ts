"use server";

import { db } from "@/db/drizzle";
import { cronJobMonitoring } from "../../../drizzle/schema";

export interface CreateCronJobMonitoringParams {
  jobName: string;
  status: string;
  startTime: string;
  logMessage?: string;
  errorMessage?: string;
}

export async function createCronJobMonitoring(params: CreateCronJobMonitoringParams) {
  try {
    const [monitoring] = await db
      .insert(cronJobMonitoring)
      .values({
        jobName: params.jobName,
        startTime: params.startTime,
        status: params.status,
        logMessage: params.logMessage,
        errorMessage: params.errorMessage,
      })
      .returning({ id: cronJobMonitoring.id });

    return monitoring;
  } catch (error) {
    console.error("Error creating cron job monitoring:", error);
    throw error;
  }
} 