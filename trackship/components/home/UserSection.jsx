"use client";
import styles from "./UserSection.module.css";
import { useState } from "react";

const usersData = [
  {
    id: 1,
    name: "Darlene Robertson",
    position: "Graphics Designer",
    department: "Sales Team",
    email: "alma.lawson@example.com",
    phone: "(252) 555-0126",
    status: "Full Time",
  },
  {
    id: 2,
    name: "Annette Black",
    position: "Joomla Developer",
    department: "Finances",
    email: "bill.sanders@example.com",
    phone: "(252) 555-0126",
    status: "Part Time",
  },
  {
    id: 3,
    name: "Ronald Richards",
    position: "Human Resource",
    department: "Management",
    email: "weaver@example.com",
    phone: "(252) 555-0126",
    status: "Full Time",
  },
  {
    id: 4,
    name: "Edward John",
    position: "Graphics Designer",
    department: "Sales",
    email: "lawson@example.com",
    phone: "(252) 555-0126",
    status: "Full Time",
    details: true,
  },
];

export default function UserSection() {
  const [selected, setSelected] = useState([]);

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2>Team List</h2>
        <button className={styles.addBtn}>+ Add User</button>
      </div>

      {/* Search */}
      <div className={styles.toolbar}>
        <input
          type="text"
          placeholder="Search Task"
          className={styles.search}
        />
        <span>{selected.length} Selected</span>
      </div>

      {/* Table */}
      <div className={styles.table}>
        <div className={styles.rowHeader}>
          <span></span>
          <span>Name</span>
          <span>Position</span>
          <span>Department</span>
          <span>Email</span>
          <span>Phone</span>
          <span>Status</span>
          <span>Edit</span>
        </div>

        {usersData.map((user) => (
          <div key={user.id} className={styles.rowWrapper}>
            <div className={styles.row}>
              <input
                type="checkbox"
                checked={selected.includes(user.id)}
                onChange={() => toggleSelect(user.id)}
              />

              <span className={styles.name}>{user.name}</span>
              <span>{user.position}</span>
              <span>{user.department}</span>
              <span>{user.email}</span>
              <span>{user.phone}</span>

              <span
                className={
                  user.status === "Full Time"
                    ? styles.fullTime
                    : styles.partTime
                }
              >
                {user.status}
              </span>

              <div className={styles.actions}>
                <button>✏️</button>
                <button>🗑️</button>
              </div>
            </div>

            {/* Expanded Section */}
            {user.details && (
              <div className={styles.expanded}>
                <div>
                  <strong>Office Location</strong>
                  <p>2972 Westheimer Rd. Santa Ana</p>
                </div>
                <div>
                  <strong>Team Mates</strong>
                  <p>Ronald, Floyd, Savannah</p>
                </div>
                <div>
                  <strong>Birthday</strong>
                  <p>12/2/1998</p>
                </div>
                <div>
                  <strong>HR Year</strong>
                  <p>4 Years</p>
                </div>
                <div>
                  <strong>Address</strong>
                  <p>4140 Parker Rd.</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}