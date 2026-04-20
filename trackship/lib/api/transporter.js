// /lib/api/transporter.js
import { ENDPOINTS, buildQueryString } from '@/lib/config';
import { request } from '@/lib/api/client';

// ============= NORMALIZE FUNCTIONS =============

function normalizeTransporters(raw) {
  console.log('Normalizing transporters, raw data:', raw);
  
  // Handle different response formats
  let arr = [];
  
  if (Array.isArray(raw?.data)) {
    arr = raw.data;
  } else if (Array.isArray(raw)) {
    arr = raw;
  } else if (raw?.users && Array.isArray(raw.users)) {
    arr = raw.users;
  } else if (raw?.rows && Array.isArray(raw.rows)) {
    arr = raw.rows;
  } else if (raw && typeof raw === 'object') {
    // If it's an object with numeric keys, convert to array
    const possibleArray = Object.values(raw);
    if (possibleArray.length > 0 && possibleArray[0]?.transporter_id) {
      arr = possibleArray;
    } else {
      arr = [];
    }
  } else {
    arr = [];
  }
  
  console.log('Extracted array:', arr);
  
  return arr.map(t => ({
    transporter_id: t.transporter_id || t.user_id,
    user_name: t.user_name,
    email: t.email,
    phone: t.phone,
    license_no: t.license_no || '—',
    verification_status: t.verification_status || 'PENDING_VERIFICATION',
    rejection_reason: t.rejection_reason || null,
    created_at: t.created_at,
    updated_at: t.updated_at,
  }));
}

function normalizeTransporterDocuments(raw) {
  let arr = [];
  
  if (Array.isArray(raw?.data)) {
    arr = raw.data;
  } else if (Array.isArray(raw)) {
    arr = raw;
  } else if (raw?.files && Array.isArray(raw.files)) {
    arr = raw.files;
  } else {
    arr = [];
  }
  
  const documents = {};
  const fileList = [];
  
  arr.forEach(doc => {
    documents[doc.doc_type] = doc.file;
    fileList.push({
      type: doc.doc_type,
      file: doc.file,
    });
  });
  
  return {
    documents,
    fileList,
    hasDocument: (docType) => !!documents[docType],
    getDocument: (docType) => documents[docType],
  };
}

// ============= ADMIN TRANSPORTER API FUNCTIONS =============

// Get all transporters - Combine pending + approved/declined from users endpoint
export async function getTransporters(params = {}) {
  try {
    // First try to get all users and filter transporters
    const usersUrl = `${ENDPOINTS.user.list}${buildQueryString(params)}`;
    console.log('Fetching all users from:', usersUrl);

    const response = await request(usersUrl);
    console.log('Response from users endpoint:', response);

    // Handle different response structures
    let users = [];
    if (Array.isArray(response)) {
      users = response;
    } else if (response?.users && Array.isArray(response.users)) {
      users = response.users;
    } else if (response?.data && Array.isArray(response.data)) {
      users = response.data;
    } else if (response?.rows && Array.isArray(response.rows)) {
      users = response.rows;
    } else {
      console.log('Response structure:', Object.keys(response));
      users = [];
    }

    console.log('Extracted users array:', users);

    // Filter only transporters by role
    const transporters = users.filter(user => user.role === 'transporter');
    console.log('Filtered transporters:', transporters);

    // Transform user data to transporter format
    const transformed = transporters.map(user => ({
      transporter_id: user.user_id,
      user_name: user.user_name,
      email: user.email,
      phone: user.phone,
      license_no: user.license_no || '—',
      verification_status: user.verification_status || 'PENDING_VERIFICATION',
      rejection_reason: user.rejection_reason || null,
      created_at: user.created_at,
      updated_at: user.updated_at,
    }));

    console.log('Transformed transporters:', transformed);
    return transformed;
  } catch (error) {
    console.error('Failed to fetch transporters from users endpoint:', error);
    // Fallback: try to get pending transporters only
    console.log('Falling back to pending transporters...');
    try {
      return await getPendingTransporters(params);
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return [];
    }
  }
}

// Get pending transporters - Uses your existing backend endpoint
export async function getPendingTransporters(params = {}) {
  try {
    const url = ENDPOINTS.transporters.pending + buildQueryString(params);
    console.log('Fetching pending transporters from:', url);
    
    const response = await request(url);
    console.log('Response from pending endpoint:', response);
    
    const normalized = normalizeTransporters(response);
    console.log('Normalized pending transporters:', normalized);
    
    return normalized;
  } catch (error) {
    console.error('Failed to fetch pending transporters:', error);
    return [];
  }
}

// Get transporter documents - Uses your existing backend endpoint
export async function getAdminTransporterDocuments(transporterId) {
  try {
    const url = ENDPOINTS.transporters.documents(transporterId);
    console.log('Fetching documents from:', url);
    
    const response = await request(url);
    console.log('Documents response:', response);
    
    return normalizeTransporterDocuments(response);
  } catch (error) {
    console.error('Failed to fetch transporter documents:', error);
    return { documents: {}, fileList: [] };
  }
}

// Verify transporter - Uses your existing backend endpoint
export async function verifyTransporter(transporterId, action, reason = null) {
  const url = ENDPOINTS.transporters.verify(transporterId);
  return await request(url, {
    method: 'POST',
    body: { action, reason },
  });
}

// Create new transporter - Uses user creation endpoint
export async function createTransporter(transporterData) {
  return await request(ENDPOINTS.user.create, {
    method: 'POST',
    body: {
      ...transporterData,
      role: 'transporter'
    },
  });
}

// Update transporter - Uses user update endpoint
export async function updateTransporter(transporterId, transporterData) {
  const url = ENDPOINTS.user.update(transporterId);
  // Remove password if empty to avoid updating with blank
  const updateData = { ...transporterData };
  if (!updateData.password) {
    delete updateData.password;
  }
  return await request(url, {
    method: 'PUT',
    body: updateData,
  });
}

// Delete transporter - Uses user delete endpoint
export async function deleteTransporter(transporterId) {
  const url = ENDPOINTS.user.delete(transporterId);
  return await request(url, {
    method: 'DELETE',
  });
}

// Get single transporter by ID
export async function getTransporterById(transporterId) {
  try {
    // Get all transporters and find by ID
    const allTransporters = await getTransporters();
    return allTransporters.find(t => t.transporter_id === parseInt(transporterId)) || null;
  } catch (error) {
    console.error('Failed to fetch transporter by ID:', error);
    return null;
  }
}