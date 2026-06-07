import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../config/firebase";
import { APP_SETTINGS } from "../config/settings";

/**
 * Fetches the schedule for a specific date (format: YYYY-MM-DD).
 * If Firestore is not connected or the document does not exist,
 * it returns the default schedules.
 * 
 * @param {string} dateString - Format 'YYYY-MM-DD'
 * @returns {Promise<{batches: Array, whatsappNumber: string, whatsappDisplay: string}>}
 */
export async function getScheduleByDate(dateString) {
  // If Firestore is not configured, return default data directly
  if (!isFirebaseConfigured || !db) {
    console.log(`[Demo Mode] Fetching default schedule for: ${dateString}`);
    return {
      batches: APP_SETTINGS.defaultSchedules,
      whatsappNumber: APP_SETTINGS.whatsappNumber,
      whatsappDisplay: APP_SETTINGS.whatsappDisplay
    };
  }

  try {
    const docRef = doc(db, "jadwal_kunjungan_ccxquest", dateString);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log(`[Firestore] Loaded schedule for: ${dateString}`, data);
      
      return {
        batches: data.batches || APP_SETTINGS.defaultSchedules,
        whatsappNumber: data.whatsappNumber || APP_SETTINGS.whatsappNumber,
        whatsappDisplay: data.whatsappDisplay || APP_SETTINGS.whatsappDisplay
      };
    } else {
      console.log(`[Firestore] No schedule found for: ${dateString}. Using defaults.`);
      return {
        batches: APP_SETTINGS.defaultSchedules,
        whatsappNumber: APP_SETTINGS.whatsappNumber,
        whatsappDisplay: APP_SETTINGS.whatsappDisplay
      };
    }
  } catch (error) {
    console.error(`Error fetching schedule for ${dateString} from Firestore:`, error);
    return {
      batches: APP_SETTINGS.defaultSchedules,
      whatsappNumber: APP_SETTINGS.whatsappNumber,
      whatsappDisplay: APP_SETTINGS.whatsappDisplay
    };
  }
}

/**
 * Saves or updates the schedule for a specific date (format: YYYY-MM-DD).
 * 
 * @param {string} dateString - Format 'YYYY-MM-DD'
 * @param {{batches: Array, whatsappNumber: string, whatsappDisplay: string}} data
 * @returns {Promise<{success: boolean, error: any}>}
 */
export async function saveScheduleByDate(dateString, data) {
  if (!isFirebaseConfigured || !db) {
    console.warn("[Demo Mode] Save operation is mocked. Firebase is not configured.");
    return { success: true, mocked: true };
  }

  try {
    const docRef = doc(db, "jadwal_kunjungan_ccxquest", dateString);
    await setDoc(docRef, {
      batches: data.batches,
      whatsappNumber: data.whatsappNumber,
      whatsappDisplay: data.whatsappDisplay,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    console.log(`[Firestore] Saved schedule for: ${dateString}`);
    return { success: true };
  } catch (error) {
    console.error(`Error saving schedule for ${dateString} to Firestore:`, error);
    return { success: false, error };
  }
}

/**
 * Fetches all schedules in the collection to populate calendar indicators.
 * 
 * @returns {Promise<Object>} Map of YYYY-MM-DD date strings to schedule data
 */
export async function getAllSchedules() {
  if (!isFirebaseConfigured || !db) {
    console.log("[Demo Mode] Fetching empty schedules map");
    return {};
  }

  try {
    const querySnapshot = await getDocs(collection(db, "jadwal_kunjungan_ccxquest"));
    const schedules = {};
    querySnapshot.forEach((doc) => {
      schedules[doc.id] = doc.data();
    });
    console.log(`[Firestore] Loaded ${Object.keys(schedules).length} schedules for calendar.`);
    return schedules;
  } catch (error) {
    console.error("Error fetching all schedules from Firestore:", error);
    return {};
  }
}

/**
 * Deletes/Resets the schedule configuration for a specific date.
 * 
 * @param {string} dateString - Format 'YYYY-MM-DD'
 * @returns {Promise<{success: boolean, error: any}>}
 */
export async function deleteScheduleByDate(dateString) {
  if (!isFirebaseConfigured || !db) {
    console.log(`[Demo Mode] Reset schedule (deleted) for: ${dateString}`);
    return { success: true, mocked: true };
  }

  try {
    const docRef = doc(db, "jadwal_kunjungan_ccxquest", dateString);
    await deleteDoc(docRef);
    console.log(`[Firestore] Deleted custom schedule for: ${dateString}`);
    return { success: true };
  } catch (error) {
    console.error(`Error deleting schedule for ${dateString} from Firestore:`, error);
    return { success: false, error };
  }
}

