'use client';
import { useState, useRef, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './ShipmentsHeader.css';

const SearchIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const FilterIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);

const ChevronIcon = ({ isOpen = false }) => (
  <svg 
    width="14" 
    height="14" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    viewBox="0 0 24 24"
    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
  >
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const STATUS_OPTIONS = [
  'Service Requested',
  'Requested Accepted',
  'Received at Hub',
  'Transporter Assigned',
  'In Transit',
  'Delivered at Hub',
  'Verified at Hub',
  'Delivered'
];

export default function ShipmentsHeader({ 
  selected = [], 
  onSearch, 
  onStatusToggle, 
  activeStatuses = [], 
  onDateChange 
}) {
  const [searchValue, setSearchValue] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  
  const datePickerRef = useRef(null);
  const statusDropdownRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setIsDatePickerOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setIsStatusDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdowns on Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsDatePickerOpen(false);
        setIsStatusDropdownOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleSearchChange = (value) => {
    setSearchValue(value);
    onSearch?.(value);
  };

  const clearSearch = () => {
    setSearchValue('');
    onSearch?.('');
  };

  const handleStatusToggle = (status) => {
    onStatusToggle?.(status);
  };

  const handleDateChange = (dates) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);

    // If both dates are selected, notify parent immediately
    if (start && end) {
      onDateChange?.({ startDate: start, endDate: end });
    }
  };

  const clearDates = () => {
    setStartDate(null);
    setEndDate(null);
    setIsDatePickerOpen(false);
    onDateChange?.(null);
  };

  const applyDates = () => {
    if (startDate && endDate) {
      setIsDatePickerOpen(false);
      onDateChange?.({ startDate, endDate });
    }
  };

  const formatDateRange = () => {
    if (!startDate && !endDate) return 'Date Range';
    if (startDate && !endDate) return startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (startDate && endDate) {
      const options = { month: 'short', day: 'numeric' };
      const startStr = startDate.toLocaleDateString('en-US', options);
      const endStr = endDate.toLocaleDateString('en-US', { ...options, year: 'numeric' });
      
      if (startDate.toDateString() === endDate.toDateString()) {
        return startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
      return `${startStr} - ${endStr}`;
    }
    return 'Date Range';
  };

  const getStatusButtonText = () => {
    if (activeStatuses.length === 0) return 'All Statuses';
    if (activeStatuses.length === 1) return activeStatuses[0];
    return `${activeStatuses.length} Statuses`;
  };

  return (
    <div className="shipments-header">
      <div className="search-wrap">
        <span className="search-icon" aria-hidden="true">
          <SearchIcon />
        </span>
        <input
          type="search"
          className="search-input"
          placeholder="Search shipments by ID, sender, or receiver..."
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          aria-label="Search shipments"
        />
        {searchValue && (
          <button
            className="search-clear"
            onClick={clearSearch}
            aria-label="Clear search"
            type="button"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      {selected.length > 0 && (
        <div className="selected-pill">
          <span className="selected-count">{selected.length}</span>
          <span className="selected-text">
            {selected.length === 1 ? 'shipment selected' : 'shipments selected'}
          </span>
        </div>
      )}

      <div className="header-actions">
        {/* Status Filter */}
        <div className="status-filter-container" ref={statusDropdownRef}>
          <button
            className={`filter-btn ${activeStatuses.length > 0 ? 'filter-btn-active' : ''}`}
            onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
            aria-expanded={isStatusDropdownOpen}
            aria-haspopup="true"
            aria-label="Filter by status"
            type="button"
          >
            <FilterIcon />
            <span className="filter-btn-text">{getStatusButtonText()}</span>
            <ChevronIcon isOpen={isStatusDropdownOpen} />
          </button>

          {isStatusDropdownOpen && (
            <div className="status-dropdown" role="menu">
              <div className="status-dropdown-header">
                <span className="dropdown-title">Filter by Status</span>
                {activeStatuses.length > 0 && (
                  <button
                    className="clear-all-btn"
                    onClick={() => handleStatusToggle(null)}
                    type="button"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="status-options-list">
                {STATUS_OPTIONS.map(status => (
                  <label key={status} className="status-option">
                    <input
                      type="checkbox"
                      checked={activeStatuses.includes(status)}
                      onChange={() => handleStatusToggle(status)}
                      aria-label={`Filter by ${status}`}
                    />
                    <span className="status-checkbox-custom" aria-hidden="true" />
                    <span className="status-label">{status}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Date Range Picker */}
        <div className="date-picker-container" ref={datePickerRef}>
          <button
            className={`filter-btn ${(startDate || endDate) ? 'filter-btn-active' : ''}`}
            onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
            aria-expanded={isDatePickerOpen}
            aria-haspopup="true"
            aria-label="Filter by date range"
            type="button"
          >
            <CalendarIcon />
            <span className="filter-btn-text">{formatDateRange()}</span>
            <ChevronIcon isOpen={isDatePickerOpen} />
          </button>

          {(startDate || endDate) && (
            <button
              className="clear-filter-badge"
              onClick={clearDates}
              aria-label="Clear date filter"
              type="button"
            >
              <CloseIcon />
            </button>
          )}

          {isDatePickerOpen && (
            <div className="date-picker-dropdown">
              <div className="date-picker-header">
                <span className="dropdown-title">Select Date Range</span>
              </div>
              <DatePicker
                selected={startDate}
                onChange={handleDateChange}
                startDate={startDate}
                endDate={endDate}
                selectsRange
                inline
                maxDate={new Date()}
                dateFormat="MMM dd, yyyy"
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                calendarClassName="custom-calendar"
              />
              <div className="date-picker-actions">
                <button
                  className="date-picker-btn date-picker-clear"
                  onClick={clearDates}
                  type="button"
                >
                  Clear
                </button>
                <button
                  className="date-picker-btn date-picker-apply"
                  onClick={applyDates}
                  disabled={!startDate || !endDate}
                  type="button"
                >
                  Apply Filter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}