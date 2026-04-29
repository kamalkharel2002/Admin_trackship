// lib/api/transporter.js (complete corrected version)

import { ENDPOINTS, buildQueryString } from '@/lib/config';
import { request } from '@/lib/api/client';

// ============= NORMALIZE FUNCTIONS =============

function normalizeTransporters(raw) {
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
    const possibleArray = Object.values(raw);
    if (possibleArray.length > 0 && possibleArray[0]?.transporter_id) {
      arr = possibleArray;
    } else {
      arr = [];
    }
  } else {
    arr = [];
  }
  
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
  let allDocs = [];
  
  // Collect transporter documents
  if (raw?.transporter_documents && Array.isArray(raw.transporter_documents)) {
    allDocs.push(...raw.transporter_documents);
  }
  
  // Collect vehicle documents (includes insurance)
  if (raw?.vehicle_documents && Array.isArray(raw.vehicle_documents)) {
    allDocs.push(...raw.vehicle_documents);
  }
  
  if (!allDocs.length && Array.isArray(raw)) {
    allDocs = raw;
  }
  
  // Debug logging
  console.log('Raw transporter docs:', raw?.transporter_documents?.map(d => d.doc_type));
  console.log('Raw vehicle docs:', raw?.vehicle_documents?.map(d => d.doc_type));
  console.log('All docs combined:', allDocs.map(d => d.doc_type));
  console.log('Insurance found in allDocs?', allDocs.some(d => d.doc_type === 'insurance'));
  
  const documents = {};
  const fileList = [];
  
  allDocs.forEach(doc => {
    documents[doc.doc_type] = doc.file;
    fileList.push({
      doc_type: doc.doc_type,      // CRITICAL: Use 'doc_type' not 'type'
      file: doc.file,
      document_id: doc.document_id,
      uploaded_at: doc.uploaded_at,
      status: doc.status || null,
      vehicle_id: doc.vehicle_id || null
    });
  });
  
  console.log('Final fileList types:', fileList.map(f => f.doc_type));
  console.log('Insurance in fileList?', fileList.some(f => f.doc_type === 'insurance'));
  
  return {
    documents,
    fileList,
    transporterDocs: raw?.transporter_documents || [],
    vehicleDocs: raw?.vehicle_documents || [],
    hasDocument: (docType) => !!documents[docType],
    getDocument: (docType) => documents[docType],
  };
}

// Normalize pending vehicle documents with deduplication
function normalizePendingVehicleDocuments(raw) {
  let arr = [];
  
  // Handle different response structures
  if (raw?.vehicle_documents && Array.isArray(raw.vehicle_documents)) {
    arr = raw.vehicle_documents;
  } else if (raw?.data && Array.isArray(raw.data)) {
    arr = raw.data;
  } else if (Array.isArray(raw)) {
    arr = raw;
  } else if (raw?.files && Array.isArray(raw.files)) {
    arr = raw.files;
  } else {
    arr = [];
  }
  
  console.log('Raw pending docs:', arr.map(d => d.doc_type));
  console.log('Insurance in pending raw?', arr.some(d => d.doc_type === 'insurance'));
  
  // Deduplicate by document_id
  const uniqueMap = new Map();
  
  arr.forEach(doc => {
    const docId = doc.document_id;
    if (!docId) {
      const compositeKey = `${doc.vehicle_id}_${doc.doc_type}_${doc.uploaded_at}`;
      if (!uniqueMap.has(compositeKey)) {
        uniqueMap.set(compositeKey, {
          document_id: doc.document_id,
          vehicle_id: doc.vehicle_id,
          vehicle_no: doc.vehicle_no,
          vehicle_type: doc.vehicle_type,
          doc_type: doc.doc_type,
          uploaded_at: doc.uploaded_at,
          file: doc.file,
          status: doc.status || 'PENDING',
        });
      }
      return;
    }
    
    if (!uniqueMap.has(docId)) {
      uniqueMap.set(docId, {
        document_id: doc.document_id,
        vehicle_id: doc.vehicle_id,
        vehicle_no: doc.vehicle_no,
        vehicle_type: doc.vehicle_type,
        doc_type: doc.doc_type,
        uploaded_at: doc.uploaded_at,
        file: doc.file,
        status: doc.status || 'PENDING',
      });
    }
  });
  
  const result = Array.from(uniqueMap.values());
  console.log('Deduped pending docs:', result.map(d => d.doc_type));
  console.log('Insurance in deduped?', result.some(d => d.doc_type === 'insurance'));
  
  return result;
}

// Normalize vehicle approval status response
function normalizeVehicleApprovalStatus(raw) {
  if (!raw?.success) {
    return {
      vehicle: null,
      documents: {
        total_docs: 0,
        approved_docs: 0,
        rejected_docs: 0,
        pending_docs: 0,
        is_fully_approved: false
      }
    };
  }
  
  return {
    vehicle: raw.vehicle,
    documents: raw.documents
  };
}

// Normalize pending vehicle requests
function normalizePendingVehicleRequests(raw) {
  let arr = [];
  
  if (raw?.data && Array.isArray(raw.data)) {
    arr = raw.data;
  } else if (Array.isArray(raw)) {
    arr = raw;
  } else {
    arr = [];
  }
  
  return arr.map(item => ({
    vehicle_id: item.vehicle_id,
    vehicle_no: item.vehicle_no,
    vehicle_type: item.vehicle_type,
    vehicle_status: item.vehicle_status,
    vehicle_created_at: item.vehicle_created_at,
    transporter_id: item.transporter_id,
    user_name: item.user_name,
    email: item.email,
    documents: item.documents || []
  }));
}

// ============= ADMIN TRANSPORTER API FUNCTIONS =============

export async function getTransporters(params = {}) {
  try {
    const url = ENDPOINTS.transporters.all + buildQueryString(params);
    const response = await request(url);
    return normalizeTransporters(response);
  } catch (error) {
    console.error('Failed to fetch transporters:', error);
    return [];
  }
}

export async function getPendingTransporters(params = {}) {
  try {
    const url = ENDPOINTS.transporters.pending + buildQueryString(params);
    const response = await request(url);
    return normalizeTransporters(response);
  } catch (error) {
    console.error('Failed to fetch pending transporters:', error);
    return [];
  }
}

export async function getAdminTransporterDocuments(transporterId) {
  try {
    const url = ENDPOINTS.transporters.documents(transporterId);
    const response = await request(url);
    return normalizeTransporterDocuments(response);
  } catch (error) {
    console.error('Failed to fetch transporter documents:', error);
    return { documents: {}, fileList: [], transporterDocs: [], vehicleDocs: [] };
  }
}

export async function verifyTransporter(transporterId, action, reason = null) {
  const url = ENDPOINTS.transporters.verify(transporterId);
  return await request(url, {
    method: 'POST',
    body: { action, reason },
  });
}

export async function deleteTransporter(transporterId) {
  const url = ENDPOINTS.user.delete(transporterId);
  return await request(url, {
    method: 'DELETE',
  });
}

export async function getTransporterById(transporterId) {
  try {
    const allTransporters = await getTransporters();
    const found = allTransporters.find(t => t.transporter_id === parseInt(transporterId));
    if (found) return found;
    const pendingTransporters = await getPendingTransporters();
    return pendingTransporters.find(t => t.transporter_id === parseInt(transporterId)) || null;
  } catch (error) {
    console.error('Failed to fetch transporter by ID:', error);
    return null;
  }
}

// ============= VEHICLE VERIFICATION FUNCTIONS =============

// Get pending vehicle documents for a specific transporter
export async function getPendingVehicleDocuments(transporterId) {
  try {
    const url = ENDPOINTS.transporters.pendingVehicleDocs(transporterId);
    const response = await request(url);
    
    console.log('Pending vehicle docs response:', response);
    
    // Response structure: { success: true, vehicle_documents: [], summary: {} }
    const docs = response?.vehicle_documents || [];
    const normalized = normalizePendingVehicleDocuments(docs);
    
    // Final deduplication safety
    const finalMap = new Map();
    normalized.forEach(doc => {
      const key = doc.document_id;
      if (!finalMap.has(key)) {
        finalMap.set(key, doc);
      }
    });
    
    const result = Array.from(finalMap.values());
    if (docs.length !== result.length) {
      console.log(`Deduplicated: ${docs.length} -> ${result.length} documents`);
    }
    
    return result;
  } catch (error) {
    console.error('Failed to fetch pending vehicle documents:', error);
    return [];
  }
}

// Get all pending vehicle requests (across all transporters)
export async function getAllPendingVehicleRequests() {
  try {
    const url = ENDPOINTS.transporters.allPendingVehicleRequests;
    const response = await request(url);
    return normalizePendingVehicleRequests(response);
  } catch (error) {
    console.error('Failed to fetch pending vehicle requests:', error);
    return [];
  }
}

// Get vehicle approval status
export async function getVehicleApprovalStatus(vehicleId) {
  try {
    const url = ENDPOINTS.transporters.vehicleApprovalStatus(vehicleId);
    const response = await request(url);
    return normalizeVehicleApprovalStatus(response);
  } catch (error) {
    console.error('Failed to fetch vehicle approval status:', error);
    return {
      vehicle: null,
      documents: {
        total_docs: 0,
        approved_docs: 0,
        rejected_docs: 0,
        pending_docs: 0,
        is_fully_approved: false
      }
    };
  }
}

// Verify a vehicle (approve or reject with all its documents)
export async function verifyVehicle(vehicleId, action, reason = null) {
  const url = ENDPOINTS.transporters.verifyVehicle(vehicleId);
  return await request(url, {
    method: 'POST',
    body: { action, reason },
  });
}

// Legacy function - maps to verifyVehicle for compatibility
export async function verifyVehicleDocument(documentId, action, reason = null) {
  console.warn('verifyVehicleDocument is deprecated. Use verifyVehicle with vehicleId instead');
  throw new Error('Use verifyVehicle with vehicleId instead of documentId');
}

// ============= HELPER FUNCTIONS =============

export async function getTransporterWithDocuments(transporterId) {
  try {
    const [transporter, documents] = await Promise.all([
      getTransporterById(transporterId),
      getAdminTransporterDocuments(transporterId)
    ]);
    return { ...transporter, documents };
  } catch (error) {
    console.error('Failed to fetch transporter with documents:', error);
    return null;
  }
}

// Batch verify vehicles (not documents)
export async function batchVerifyVehicles(verifications) {
  try {
    const results = await Promise.all(
      verifications.map(async ({ vehicleId, action, reason }) => {
        try {
          const result = await verifyVehicle(vehicleId, action, reason);
          return { success: true, vehicleId, action, data: result };
        } catch (error) {
          return { success: false, vehicleId, action, error: error.message };
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
    console.error('Failed to batch verify vehicles:', error);
    return { success: [], failed: verifications, total: verifications.length, successCount: 0, failedCount: verifications.length };
  }
}

// Get all pending vehicle change requests (aggregated)
export async function getAllPendingVehicleChangeRequests() {
  try {
    // Use the dedicated backend endpoint if available
    try {
      const response = await getAllPendingVehicleRequests();
      return response;
    } catch (error) {
      // Fallback: fetch from each transporter
      console.log('Falling back to manual aggregation for vehicle requests');
      const allTransporters = await getTransporters();
      const activeTransporters = allTransporters.filter(t => 
        ['APPROVED', 'ACTIVE'].includes(t.verification_status)
      );
      
      const allDocs = [];
      for (const transporter of activeTransporters) {
        try {
          const pendingDocs = await getPendingVehicleDocuments(transporter.transporter_id);
          allDocs.push(...pendingDocs.map(doc => ({
            ...doc,
            transporter_id: transporter.transporter_id,
            transporter_name: transporter.user_name,
            transporter_email: transporter.email,
          })));
        } catch (error) {
          console.error(`Failed to fetch docs for transporter ${transporter.transporter_id}:`, error);
        }
      }
      
      // Final deduplication across all transporters
      const uniqueMap = new Map();
      allDocs.forEach(doc => {
        if (!uniqueMap.has(doc.document_id)) {
          uniqueMap.set(doc.document_id, doc);
        }
      });
      
      return Array.from(uniqueMap.values());
    }
  } catch (error) {
    console.error('Failed to fetch all pending vehicle changes:', error);
    return [];
  }
}

export async function getPendingVerificationCounts() {
  try {
    const [pendingTransporters, pendingVehicleRequests] = await Promise.all([
      getPendingTransporters(),
      getAllPendingVehicleRequests()
    ]);
    
    return {
      pendingTransporters: pendingTransporters.length,
      pendingVehicleChanges: pendingVehicleRequests.length,
      total: pendingTransporters.length + pendingVehicleRequests.length,
    };
  } catch (error) {
    console.error('Failed to fetch pending counts:', error);
    return { pendingTransporters: 0, pendingVehicleChanges: 0, total: 0 };
  }
}