export type CalorieProfileInput = {
  dateOfBirth?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  gender?: string | null;
};

export const getAgeFromDateOfBirth = (dateOfBirth?: string | null, today = new Date()) => {
  if (!dateOfBirth) {
    return null;
  }

  const parts = dateOfBirth.split("-");
  if (parts.length !== 3) {
    return null;
  }

  const [yearStr, monthStr, dayStr] = parts;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  let age = today.getFullYear() - year;
  const monthDelta = today.getMonth() + 1 - month;
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < day)) {
    age -= 1;
  }

  return age > 0 ? age : null;
};

export const estimateDailyBurn = (profile?: CalorieProfileInput | null) => {
  if (!profile) {
    return null;
  }

  if (profile.heightCm == null || profile.weightKg == null) {
    return null;
  }

  const heightCm = Number(profile.heightCm);
  const weightKg = Number(profile.weightKg);
  const age = getAgeFromDateOfBirth(profile.dateOfBirth);

  if (!Number.isFinite(heightCm) || !Number.isFinite(weightKg) || age == null) {
    return null;
  }

  const gender = profile.gender?.trim().toLowerCase();
  let adjustment = -78;
  if (gender === 'male') {
    adjustment = 5;
  } else if (gender === 'female') {
    adjustment = -161;
  }

  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + adjustment;
  const sedentaryDailyBurn = bmr * 1.2;
  return Math.max(0, Math.round(sedentaryDailyBurn));
};
