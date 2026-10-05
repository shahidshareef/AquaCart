import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";

function AdminProfile() {
    const [admin, setAdmin] = useState(null);

    const [isEditing, setIsEditing] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const [passwordMessage, setPasswordMessage] = useState("");
    const [passwordMessageType, setPasswordMessageType] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    useEffect(function () {
        fetchAdminProfile();
    }, []);

    async function fetchAdminProfile() {
        try {
            setMessage("");
            setMessageType("");
            setLoading(true);

            const response = await fetch(
                "http://localhost:5000/api/admin/profile"
            );

            const result = await response.json();

            if (!response.ok) {
                setMessage(
                    result.message || "Failed to fetch admin profile."
                );
                setMessageType("error");
                return;
            }

            setAdmin(result.data);

            setName(result.data.name);
            setEmail(result.data.email);
            setPhone(result.data.phone);

        } catch (error) {
            console.log(error);

            setMessage(
                "Something went wrong while fetching admin profile."
            );
            setMessageType("error");

        } finally {
            setLoading(false);
        }
    }

    function startEditing() {
        setMessage("");
        setMessageType("");

        setName(admin.name);
        setEmail(admin.email);
        setPhone(admin.phone);

        setIsEditing(true);
    }

    function cancelEditing() {
        setName(admin.name);
        setEmail(admin.email);
        setPhone(admin.phone);

        setMessage("");
        setMessageType("");

        setIsEditing(false);
    }

    function openPasswordForm() {
        setPasswordMessage("");
        setPasswordMessageType("");

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        setShowPasswordForm(true);
    }

    function closePasswordForm() {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        setPasswordMessage("");
        setPasswordMessageType("");

        setShowPasswordForm(false);
    }

    async function handleSaveProfile(event) {
        event.preventDefault();

        if (!name.trim() || !email.trim() || !phone.trim()) {
            setMessage("Name, email, and phone are required.");
            setMessageType("error");
            return;
        }

        try {
            setSaving(true);
            setMessage("");
            setMessageType("");

            const response = await fetch(
                "http://localhost:5000/api/admin/profile",
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name: name.trim(),
                        email: email.trim(),
                        phone: phone.trim()
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                setMessage(
                    result.message || "Failed to update admin profile."
                );
                setMessageType("error");
                return;
            }

            setAdmin(result.data);

            setName(result.data.name);
            setEmail(result.data.email);
            setPhone(result.data.phone);

            setIsEditing(false);

            setMessage("Admin profile updated successfully.");
            setMessageType("success");

        } catch (error) {
            console.log(error);

            setMessage(
                "Something went wrong while updating admin profile."
            );
            setMessageType("error");

        } finally {
            setSaving(false);
        }
    }

    async function handleChangePassword(event) {
        event.preventDefault();

        setPasswordMessage("");
        setPasswordMessageType("");

        if (
            !currentPassword ||
            !newPassword ||
            !confirmPassword
        ) {
            setPasswordMessage("All password fields are required.");
            setPasswordMessageType("error");
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordMessage(
                "New password and confirm password do not match."
            );
            setPasswordMessageType("error");
            return;
        }

        if (newPassword.length < 8) {
            setPasswordMessage(
                "New password must be at least 8 characters."
            );
            setPasswordMessageType("error");
            return;
        }

        try {
            setChangingPassword(true);

            const response = await fetch(
                "http://localhost:5000/api/admin/profile/password",
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        currentPassword: currentPassword,
                        newPassword: newPassword,
                        confirmPassword: confirmPassword
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                setPasswordMessage(
                    result.message || "Failed to change password."
                );
                setPasswordMessageType("error");
                return;
            }

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

            setPasswordMessage(
                "Password changed successfully."
            );
            setPasswordMessageType("success");

        } catch (error) {
            console.log(error);

            setPasswordMessage(
                "Something went wrong while changing the password."
            );
            setPasswordMessageType("error");

        } finally {
            setChangingPassword(false);
        }
    }

    function getAdminInitials(name) {
        if (!name) {
            return "?";
        }

        const nameParts = name.trim().split(" ");

        if (nameParts.length === 1) {
            return nameParts[0].charAt(0).toUpperCase();
        }

        return (
            nameParts[0].charAt(0) +
            nameParts[nameParts.length - 1].charAt(0)
        ).toUpperCase();
    }

    return (
        <AdminLayout pageTitle="Admin Profile">

            <div className="space-y-6">

                {/* Workspace Header */}
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                        Admin Profile
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        View and manage your administrator account details.
                    </p>
                </div>

                {/* Profile Message */}
                {message && (
                    <div
                        className={
                            messageType === "success"
                                ? "rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
                                : "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                        }
                    >
                        {message}
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
                        Loading admin profile...
                    </div>
                )}

                {/* Profile */}
                {!loading && admin && (
                    <>
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">

                            {/* Profile Header */}
                            <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">

                                <div className="flex items-center gap-4">

                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-50 text-lg font-bold text-sky-600">
                                        {getAdminInitials(admin.name)}
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">
                                            {admin.name}
                                        </h3>

                                        <p className="mt-1 text-sm text-slate-500">
                                            Administrator
                                        </p>
                                    </div>

                                </div>

                                {!isEditing && (
                                    <button
                                        type="button"
                                        onClick={startEditing}
                                        className="rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-sky-600"
                                    >
                                        Edit Profile
                                    </button>
                                )}

                            </div>

                            {/* Edit Form */}
                            {isEditing ? (

                                <form
                                    onSubmit={handleSaveProfile}
                                    className="px-6 py-6"
                                >

                                    <h4 className="mb-5 text-sm font-semibold text-slate-900">
                                        Edit Account Information
                                    </h4>

                                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                                        {/* Name */}
                                        <div>
                                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                Full Name
                                            </label>

                                            <input
                                                type="text"
                                                value={name}
                                                onChange={function (event) {
                                                    setName(event.target.value);
                                                }}
                                                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                            />
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                Email
                                            </label>

                                            <input
                                                type="email"
                                                value={email}
                                                onChange={function (event) {
                                                    setEmail(event.target.value);
                                                }}
                                                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                            />
                                        </div>

                                        {/* Phone */}
                                        <div>
                                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                Phone
                                            </label>

                                            <input
                                                type="text"
                                                value={phone}
                                                onChange={function (event) {
                                                    setPhone(event.target.value);
                                                }}
                                                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                            />
                                        </div>

                                        {/* Role */}
                                        <div>
                                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                Role
                                            </label>

                                            <input
                                                type="text"
                                                value="Administrator"
                                                disabled
                                                className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500"
                                            />
                                        </div>

                                    </div>

                                    {/* Form Actions */}
                                    <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">

                                        <button
                                            type="button"
                                            onClick={cancelEditing}
                                            disabled={saving}
                                            className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {saving
                                                ? "Saving..."
                                                : "Save Changes"}
                                        </button>

                                    </div>

                                </form>

                            ) : (

                                /* View Mode */
                                <div className="px-6 py-6">

                                    <h4 className="mb-5 text-sm font-semibold text-slate-900">
                                        Account Information
                                    </h4>

                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

                                        {/* Name */}
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                Full Name
                                            </p>

                                            <p className="mt-1 text-sm font-medium text-slate-800">
                                                {admin.name}
                                            </p>
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                Email
                                            </p>

                                            <p className="mt-1 break-all text-sm font-medium text-slate-800">
                                                {admin.email}
                                            </p>
                                        </div>

                                        {/* Phone */}
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                Phone
                                            </p>

                                            <p className="mt-1 text-sm font-medium text-slate-800">
                                                {admin.phone}
                                            </p>
                                        </div>

                                        {/* Role */}
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                Role
                                            </p>

                                            <p className="mt-1 text-sm font-medium text-slate-800">
                                                Administrator
                                            </p>
                                        </div>

                                        {/* Status */}
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                Account Status
                                            </p>

                                            <span
                                                className={
                                                    admin.status === "active"
                                                        ? "mt-1 inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700"
                                                        : "mt-1 inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700"
                                                }
                                            >
                                                {admin.status === "active"
                                                    ? "Active"
                                                    : "Blocked"}
                                            </span>
                                        </div>

                                    </div>

                                </div>

                            )}

                        </div>

                        {/* Change Password */}
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">

                            {!showPasswordForm ? (

                                <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">
                                            Change Password
                                        </h3>

                                        <p className="mt-1 text-sm text-slate-500">
                                            Update your administrator account password.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={openPasswordForm}
                                        className="rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-sky-600"
                                    >
                                        Change Password
                                    </button>

                                </div>

                            ) : (

                                <>
                                    <div className="border-b border-slate-200 px-6 py-5">
                                        <h3 className="text-lg font-bold text-slate-900">
                                            Change Password
                                        </h3>

                                        <p className="mt-1 text-sm text-slate-500">
                                            Update your administrator account password.
                                        </p>
                                    </div>

                                    <form
                                        onSubmit={handleChangePassword}
                                        className="px-6 py-6"
                                    >

                                        {passwordMessage && (
                                            <div
                                                className={
                                                    passwordMessageType === "success"
                                                        ? "mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
                                                        : "mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                                                }
                                            >
                                                {passwordMessage}
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                                            {/* Current Password */}
                                            <div className="sm:col-span-2">
                                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                    Current Password
                                                </label>

                                                <input
                                                    type="password"
                                                    value={currentPassword}
                                                    onChange={function (event) {
                                                        setCurrentPassword(
                                                            event.target.value
                                                        );
                                                    }}
                                                    placeholder="Enter current password"
                                                    autoComplete="current-password"
                                                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                                />
                                            </div>

                                            {/* New Password */}
                                            <div>
                                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                    New Password
                                                </label>

                                                <input
                                                    type="password"
                                                    value={newPassword}
                                                    onChange={function (event) {
                                                        setNewPassword(
                                                            event.target.value
                                                        );
                                                    }}
                                                    placeholder="Enter new password"
                                                    autoComplete="new-password"
                                                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                                />
                                            </div>

                                            {/* Confirm Password */}
                                            <div>
                                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                    Confirm New Password
                                                </label>

                                                <input
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={function (event) {
                                                        setConfirmPassword(
                                                            event.target.value
                                                        );
                                                    }}
                                                    placeholder="Confirm new password"
                                                    autoComplete="new-password"
                                                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                                />
                                            </div>

                                        </div>

                                        <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">

                                            <button
                                                type="button"
                                                onClick={closePasswordForm}
                                                disabled={changingPassword}
                                                className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>

                                            <button
                                                type="submit"
                                                disabled={changingPassword}
                                                className="rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {changingPassword
                                                    ? "Changing Password..."
                                                    : "Change Password"}
                                            </button>

                                        </div>

                                    </form>
                                </>

                            )}

                        </div>
                    </>
                )}

            </div>

        </AdminLayout>
    );
}

export default AdminProfile;