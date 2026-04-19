import type { WanikaniReviewBucket, WanikaniSection } from '../../src/types/dashboard';

import { cached, ensureOk, errorMeta, getEnv, missingConfig, readyMeta, withTimeout } from './shared';

type SummaryBucket = {
  available_at: string;
  subject_ids: number[];
};

type WanikaniSummary = {
  data: {
    lessons: SummaryBucket[];
    next_reviews_at: string | null;
    reviews: SummaryBucket[];
  };
};

const countSubjects = (buckets: SummaryBucket[]): number =>
  buckets.reduce((total, bucket) => total + bucket.subject_ids.length, 0);

const loadWanikani = async (): Promise<WanikaniSection> => {
  const token = getEnv('WANIKANI_API_TOKEN');
  if (!token) {
    return {
      ...missingConfig('Set WANIKANI_API_TOKEN to show reviews and lessons.'),
      reviewsAvailable: 0,
      lessonsAvailable: 0,
      upcomingReviews: []
    };
  }

  const response = await withTimeout((signal) =>
    fetch('https://api.wanikani.com/v2/summary', {
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        'Wanikani-Revision': '20170710',
        Accept: 'application/json'
      }
    })
  );
  await ensureOk(response, 'WaniKani summary request');

  const summary = (await response.json()) as WanikaniSummary;
  const now = Date.now();
  const reviewsAvailable = summary.data.reviews
    .filter((bucket) => new Date(bucket.available_at).getTime() <= now)
    .reduce((total, bucket) => total + bucket.subject_ids.length, 0);
  const upcomingReviews = summary.data.reviews
    .filter((bucket) => bucket.subject_ids.length > 0 && new Date(bucket.available_at).getTime() > now)
    .slice(0, 6)
    .map<WanikaniReviewBucket>((bucket) => ({
      availableAt: bucket.available_at,
      count: bucket.subject_ids.length
    }));

  return {
    ...readyMeta(),
    reviewsAvailable,
    lessonsAvailable: countSubjects(summary.data.lessons),
    nextReviewsAt: summary.data.next_reviews_at ?? undefined,
    upcomingReviews
  };
};

export const getWanikani = async (): Promise<WanikaniSection> => {
  try {
    return await cached('wanikani', 60_000, loadWanikani);
  } catch (error) {
    return {
      ...errorMeta(error, 'WaniKani summary is unavailable.'),
      reviewsAvailable: 0,
      lessonsAvailable: 0,
      upcomingReviews: []
    };
  }
};
