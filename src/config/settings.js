export const APP_SETTINGS = {
  // Direct WhatsApp link configuration
  // The phone number must include country code without '+' (e.g., '628131073719' for Indonesia)
  whatsappNumber: '628131073719', 
  whatsappDisplay: '08131073719',
  
  // Default schedules when there is no data in Firestore for a selected date
  defaultSchedules: [
    {
      id: 1,
      batch: 'Batch 1',
      time: '08:45',
      status: 'tersedia_quota', // 'tersedia_quota' | 'tersedia' | 'penuh'
      quota: 50,
      statusLabel: 'TERSEDIA 50 ORANG'
    },
    {
      id: 2,
      batch: 'Batch 2',
      time: '09:45',
      status: 'tersedia_quota',
      quota: 24,
      statusLabel: 'TERSEDIA 24 ORANG'
    },
    {
      id: 3,
      batch: 'Batch 3',
      time: '12:45',
      status: 'tersedia',
      quota: null,
      statusLabel: 'TERSEDIA'
    },
    {
      id: 4,
      batch: 'Batch 4',
      time: '13:45',
      status: 'tersedia',
      quota: null,
      statusLabel: 'TERSEDIA'
    },
    {
      id: 5,
      batch: 'Batch 5',
      time: '14:45',
      status: 'tersedia',
      quota: null,
      statusLabel: 'TERSEDIA'
    }
  ]
};
