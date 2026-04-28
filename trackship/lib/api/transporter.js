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
    total_shipments: t.total_shipments || 0,
    total_success_shipments: t.total_success_shipments || 0,
    has_pending_vehicle_docs: t.has_pending_vehicle_docs || false,
    vehicle_type: t.vehicle_type,
    vehicle_no: t.vehicle_no,
  }));
}

function normalizeTransporterDocuments(raw) {
  // Handle the backend response structure which has transporter_documents and vehicle_documents
  let allDocs = [];
  
  if (raw?.transporter_documents && Array.isArray(raw.transporter_documents)) {
    allDocs.push(...raw.transporter_documents);
  }
  if (raw?.vehicle_documents && Array.isArray(raw.vehicle_documents)) {
    allDocs.push(...raw.vehicle_documents);
  }
  
  // Also handle direct array response
  if (!allDocs.length && Array.isArray(raw)) {
    allDocs = raw;
  }
  
  const documents = {};
  const fileList = [];
  
  allDocs.forEach(doc => {
    documents[doc.doc_type] = doc.file;
    fileList.push({
      type: doc.doc_type,
      file: doc.file,
    });
  });
  
  return {
    documents,
    fileList,
    transporterDocs: raw?.transporter_documents || [],
    vehicleDocs: raw?.vehicle_documents || [],
    hasDocument: (docType) => !!documents[docType],
    getDocument: (docType) => documents[docType],
  };
}

// Normalize pending vehicle documents - matches backend response
function normalizePendingVehicleDocuments(raw) {
  let arr = [];
  
  // Backend returns array directly
  if (Array.isArray(raw)) {
    arr = raw;
  } else if (raw?.data && Array.isArray(raw.data)) {
    arr = raw.data;
  } else if (raw?.files && Array.isArray(raw.files)) {
    arr = raw.files;
  } else {
    arr = [];
  }
  
  return arr.map(doc => ({
    document_id: doc.document_id,
    vehicle_id: doc.vehicle_id,
    vehicle_no: doc.vehicle_no,
    vehicle_type: doc.vehicle_type,
    doc_type: doc.doc_type,
    uploaded_at: doc.uploaded_at,
    file: doc.file,
    status: doc.status || 'PENDING',
    transporter_id: doc.transporter_id,
    transporter_name: doc.user_name,
    transporter_email: doc.email,
  }));
}

// ============= ADMIN TRANSPORTER API FUNCTIONS =============

// Get all transporters
export async function getTransporters(params = {}) {
  try {
    const url = ENDPOINTS.transporters.all + buildQueryString(params);
    console.log('Fetching all transporters from:', url);

    const response = await request(url);
    console.log('Response from transporters endpoint:', response);

    const normalized = normalizeTransporters(response);
    console.log('Normalized transporters:', normalized);
    
    return normalized;
  } catch (error) {
    console.error('Failed to fetch transporters:', error);
    return [];
  }
}

// Get pending transporters (for initial registration)
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

// Get transporter documents (for initial registration review)
export async function getAdminTransporterDocuments(transporterId) {
  try {
    const url = ENDPOINTS.transporters.documents(transporterId);
    console.log('Fetching documents from:', url);
    
    const response = await request(url);
    console.log('Documents response:', response);
    
    return normalizeTransporterDocuments(response);
  } catch (error) {
    console.error('Failed to fetch transporter documents:', error);
    return { documents: {}, fileList: [], transporterDocs: [], vehicleDocs: [] };
  }
}

// Verify transporter (APPROVED/DECLINED) - For initial registration
export async function verifyTransporter(transporterId, action, reason = null) {
  const url = ENDPOINTS.transporters.verify(transporterId);
  return await request(url, {
    method: 'POST',
    body: { action, reason },
  });
}

// Delete transporter
export async function deleteTransporter(transporterId) {
  const url = ENDPOINTS.user.delete(transporterId);
  return await request(url, {
    method: 'DELETE',
  });
}

// Get single transporter by ID
export async function getTransporterById(transporterId) {
  try {
    // First try to get from all transporters
    const allTransporters = await getTransporters();
    const found = allTransporters.find(t => t.transporter_id === parseInt(transporterId));
    
    if (found) return found;
    
    // If not found, try pending transporters
    const pendingTransporters = await getPendingTransporters();
    return pendingTransporters.find(t => t.transporter_id === parseInt(transporterId)) || null;
  } catch (error) {
    console.error('Failed to fetch transporter by ID:', error);
    return null;
  }
}

// ============= VEHICLE DOCUMENT FUNCTIONS (for active transporters) =============

// Get pending vehicle documents for a specific transporter (vehicle change requests)
export async function getPendingVehicleDocuments(transporterId) {
  try {
    const url = ENDPOINTS.transporters.pendingVehicleDocs(transporterId);
    console.log('Fetching pending vehicle documents from:', url);
    
    const response = await request(url);
    console.log('Pending vehicle documents response:', response);
    
    return normalizePendingVehicleDocuments(response);
  } catch (error) {
    console.error('Failed to fetch pending vehicle documents:', error);
    return [];
  }
}

// Verify a single vehicle document (APPROVED/REJECTED)
export async function verifyVehicleDocument(documentId, action) {
  try {
    const url = ENDPOINTS.transporters.verifyVehicleDoc(documentId);
    console.log('Verifying vehicle document at:', url, 'with action:', action);
    
    const response = await request(url, {
      method: 'POST',
      body: { action },
    });
    
    return response;
  } catch (error) {
    console.error('Failed to verify vehicle document:', error);
    throw error;
  }
}

/**
 * Get all pending vehicle change requests across all active transporters
 * Note: This requires a backend endpoint or falls back to individual requests
 */
export async function getAllPendingVehicleChangeRequests() {
  try {
    // First, try to get all pending vehicle docs from a dedicated endpoint if it exists
    // You may need to add this endpoint to your backend
    const url = `${ENDPOINTS.transporters.all}/vehicle-documents/pending/all`;
    
    try {
      // Try batch endpoint first (if implemented in backend)
      const response = await request(url);
      if (response && Array.isArray(response)) {
        return normalizePendingVehicleDocuments(response);
      }
    } catch (batchError) {
      console.log('Batch endpoint not available, falling back to individual requests');
    }
    
    // Fallback: Get all active transporters and fetch individually
    const allTransporters = await getTransporters();
    const activeTransporters = allTransporters.filter(t => 
      ['APPROVED', 'ACTIVE'].includes(t.verification_status)
    );
    
    // Use Promise.all for parallel requests
    const pendingRequestsArrays = await Promise.all(
      activeTransporters.map(async (transporter) => {
        try {
          const pendingDocs = await getPendingVehicleDocuments(transporter.transporter_id);
          return pendingDocs.map(doc => ({
            ...doc,
            transporter_id: transporter.transporter_id,
            transporter_name: transporter.user_name,
            transporter_email: transporter.email,
          }));
        } catch (error) {
          console.error(`Failed to fetch docs for transporter ${transporter.transporter_id}:`, error);
          return [];
        }
      })
    );
    
    return pendingRequestsArrays.flat();
  } catch (error) {
    console.error('Failed to fetch all pending vehicle changes:', error);
    return [];
  }
}

// ============= ADDITIONAL HELPER FUNCTIONS =============

// Get transporter details with their documents
export async function getTransporterWithDocuments(transporterId) {
  try {
    const [transporter, documents] = await Promise.all([
      getTransporterById(transporterId),
      getAdminTransporterDocuments(transporterId)
    ]);
    
    return {
      ...transporter,
      documents,
    };
  } catch (error) {
    console.error('Failed to fetch transporter with documents:', error);
    return null;
  }
}

// Batch verify multiple vehicle documents
export async function batchVerifyVehicleDocuments(verifications) {
  // verifications should be an array of { documentId, action }
  try {
    const results = await Promise.all(
      verifications.map(async ({ documentId, action }) => {
        try {
          const result = await verifyVehicleDocument(documentId, action);
          return { success: true, documentId, action, data: result };
        } catch (error) {
          return { success: false, documentId, action, error: error.message };
        }
      })
    );
    
    return {
      success: results.filter(r => r.success),
      failed: results.filter(r => !r.success),
      total: results.length,
      successCount: results.filter(r => r.success).length,
      failedCount: results.filter(r => !r.success).length,
    };
  } catch (error) {
    console.error('Failed to batch verify documents:', error);
    return { success: [], failed: verifications, total: verifications.length, successCount: 0, failedCount: verifications.length };
  }
}

// Get pending count for dashboard
export async function getPendingVerificationCounts() {
  try {
    const [pendingTransporters, pendingVehicleChanges] = await Promise.all([
      getPendingTransporters(),
      getAllPendingVehicleChangeRequests()
    ]);
    
    return {
      pendingTransporters: pendingTransporters.length,
      pendingVehicleChanges: pendingVehicleChanges.length,
      total: pendingTransporters.length + pendingVehicleChanges.length,
    };
  } catch (error) {
    console.error('Failed to fetch pending counts:', error);
    return { pendingTransporters: 0, pendingVehicleChanges: 0, total: 0 };
  }
}

// Update vehicle status after all documents are approved (helper function)
export async function checkAndUpdateVehicleStatus(vehicleId) {
  try {
    // This would call a backend endpoint to check if all documents for a vehicle are approved
    // and update vehicle status to ACTIVE if needed
    const url = `${ENDPOINTS.transporters.all}/vehicles/${vehicleId}/check-status`;
    const response = await request(url, {
      method: 'POST',
    });
    return response;
  } catch (error) {
    console.error('Failed to check/update vehicle status:', error);
    return null;
  }
}