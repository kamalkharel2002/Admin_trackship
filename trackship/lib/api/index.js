// lib/api/index.js
export { loginUser, logoutUser } from './auth';
export {
  getDashboardSummary,
  getHubShipments,
  getPendingTransporters as getDashboardPendingTransporters,
  getAdminProfile,
} from './dashboard';
export {
  getHubs,
  createHub,
  updateHub,
  deleteHub,
  getCoordinators,
  getHubCoordinatorsForEdits,
} from './hub';
export {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from './users';
export {
  getShipments,
  getShipmentById,
} from './shipments';
export {
  // Transporter management (admin)
  getTransporters,
  getPendingTransporters,
  getTransporterById,
  deleteTransporter,
  getAdminTransporterDocuments,
  verifyTransporter,
  // Vehicle document management
  getPendingVehicleDocuments,
  verifyVehicleDocument,
  getAllPendingVehicleChangeRequests,
  // Helper functions
  getTransporterWithDocuments,
  batchVerifyVehicleDocuments,
  getPendingVerificationCounts,
  checkAndUpdateVehicleStatus,  // New export
} from './transporter';
export {
  getPaymentDashboardSummary,
  getCashLedgerReport,
  getPaymentReconciliationReport,
  getHubWiseCashBalance,
  getPaymentFilterOptions,
  exportCashLedgerCSV,
  exportPaymentReconciliationCSV,
} from './payment';
export {
  getTotalRevenue,
  getTotalDeliveredShipments,
  getMonthlyRevenueGraph,
  getShipmentStatusDistribution,
  exportRevenueCSV,
  exportShipmentCSV,
} from './report';