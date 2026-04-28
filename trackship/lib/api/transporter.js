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
  
  if (raw?.transporter_documents && Array.isArray(raw.transporter_documents)) {
    allDocs.push(...raw.transporter_documents);
  }
  if (raw?.vehicle_documents && Array.isArray(raw.vehicle_documents)) {
    allDocs.push(...raw.vehicle_documents);
  }
  
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

// Normalize pending vehicle documents with deduplication
function normalizePendingVehicleDocuments(raw) {
  let arr = [];
  
  if (Array.isArray(raw)) {
    arr = raw;
  } else if (raw?.data && Array.isArray(raw.data)) {
    arr = raw.data;
  } else if (raw?.files && Array.isArray(raw.files)) {
    arr = raw.files;
  } else {
    arr = [];
  }
  
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
          transporter_id: doc.transporter_id,
          transporter_name: doc.user_name,
          transporter_email: doc.email,
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
        transporter_id: doc.transporter_id,
        transporter_name: doc.user_name,
        transporter_email: doc.email,
      });
    }
  });
  
  return Array.from(uniqueMap.values());
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

// ============= VEHICLE DOCUMENT FUNCTIONS =============

export async function getPendingVehicleDocuments(transporterId) {
  try {
    const url = ENDPOINTS.transporters.pendingVehicleDocs(transporterId);
    const response = await request(url);
    
    // Ensure we have an array and deduplicate
    const docs = Array.isArray(response) ? response : [];
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

export async function verifyVehicleDocument(documentId, action, reason = null) {
  try {
    const url = ENDPOINTS.transporters.verifyVehicleDoc(documentId);
    const response = await request(url, {
      method: 'POST',
      body: { action, reason },
    });
    return response;
  } catch (error) {
    console.error('Failed to verify vehicle document:', error);
    throw error;
  }
}

export async function getAllPendingVehicleChangeRequests() {
  try {
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
  } catch (error) {
    console.error('Failed to fetch all pending vehicle changes:', error);
    return [];
  }
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

export async function batchVerifyVehicleDocuments(verifications) {
  try {
    const results = await Promise.all(
      verifications.map(async ({ documentId, action, reason }) => {
        try {
          const result = await verifyVehicleDocument(documentId, action, reason);
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