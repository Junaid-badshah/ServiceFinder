import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import api from "../../services/api";
import CameraCapture from "../../components/providers/CameraCapture";

function Profile() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);

  const loadProfile = async () => {
    try {
      const res = await api.get("/profile/me");
      setProfile(res.data);
      setForm({ name: res.data.name || "", phone: res.data.phone || "" });
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403 || err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return;
      }
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async () => {
    setError("");
    setSuccess("");

    if (form.phone !== profile.phone && form.phone.length > 0) {
      setSendingOtp(true);
      try {
        await api.post("/profile/send-otp", { newPhone: form.phone });
        setShowOtpInput(true);
        setSuccess("OTP sent! Check backend terminal (VS Code) for the code.");
      } catch (err) {
        setError(err.response?.data?.error || "Failed to send OTP");
      } finally {
        setSendingOtp(false);
      }
      return;
    }

    setSaving(true);
    try {
      await api.put("/profile/update", { name: form.name, phone: form.phone });
      setSuccess("Profile updated successfully");
      setEditing(false);
      loadProfile();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpError("");
    setOtpSuccess("");
    if (otp.length !== 6) {
      setOtpError("Please enter 6-digit OTP");
      return;
    }

    setSaving(true);
    try {
      await api.put("/profile/verify-otp-and-update", {
        newPhone: form.phone,
        otp: otp,
      });
      setOtpSuccess("Phone number updated successfully!");
      setShowOtpInput(false);
      setOtp("");
      setEditing(false);
      loadProfile();
      setTimeout(() => {
        setOtpSuccess("");
        setSuccess("");
      }, 3000);
    } catch (err) {
      setOtpError(err.response?.data?.error || "Invalid OTP");
    } finally {
      setSaving(false);
    }
  };

  const handlePictureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Image size must be under 2MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    setUploading(true);
    setError("");

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result;
        const res = await api.put("/profile/picture", {
          profilePicture: base64,
        });
        setProfile({ ...profile, profilePicture: res.data.profilePicture });
        setSuccess("Profile picture updated");
        setTimeout(() => setSuccess(""), 3000);
      } catch (err) {
        setError("Failed to upload picture");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = async (base64Image) => {
    setShowCamera(false);
    setUploading(true);
    setError("");
    try {
      const res = await api.put("/profile/picture", {
        profilePicture: base64Image,
      });
      setProfile({ ...profile, profilePicture: res.data.profilePicture });
      setSuccess("Profile picture updated");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to upload picture");
    } finally {
      setUploading(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (
        !passwordForm.currentPassword ||
        !passwordForm.newPassword ||
        !passwordForm.confirmPassword
    ) {
      setPasswordError("All fields are required");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    setChangingPassword(true);
    try {
      await api.put("/profile/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordSuccess("Password changed successfully!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => {
        setPasswordSuccess("");
        setShowPasswordForm(false);
      }, 3000);
    } catch (err) {
      setPasswordError(
          err.response?.data?.error || "Failed to change password",
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const handleRemovePicture = async () => {
    if (!window.confirm("Remove profile picture?")) return;
    try {
      await api.put("/profile/picture", { profilePicture: "" });
      setProfile({ ...profile, profilePicture: "" });
      setSuccess("Picture removed");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to remove picture");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading)
    return (
        <div className="text-center py-20 text-gray-500">Loading profile...</div>
    );
  if (!profile)
    return (
        <div className="text-center py-20 text-red-500">Profile not found</div>
    );

  const isProvider = profile.role === "PROVIDER";
  const p = profile.providerProfile;

  const inputClass =
      "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500";

  return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <button
              onClick={() => navigate(-1)}
              className="mb-4 text-primary-600 hover:underline text-sm font-semibold"
          >
            ← Back
          </button>

          {/* Header with profile picture */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white mb-6">
            <div className="flex items-center gap-5 flex-wrap">
              <div className="relative">
                <div className="w-28 h-28 rounded-full bg-white/20 flex items-center justify-center text-5xl font-bold overflow-hidden border-4 border-white/30 shadow-xl">
                  {profile.profilePicture ? (
                      <img
                          src={profile.profilePicture}
                          alt={profile.name}
                          className="w-full h-full object-cover"
                      />
                  ) : (
                      <span>{profile.name?.charAt(0).toUpperCase() || "?"}</span>
                  )}
                </div>

                <button
                    type="button"
                    onClick={() => setShowCamera(true)}
                    disabled={uploading}
                    className={`absolute bottom-0 right-0 bg-white text-primary-600 w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:bg-primary-50 hover:scale-110 transition border-2 border-primary-200 ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
                    title="Take Photo"
                >
                  {uploading ? (
                      <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                      <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.2}
                      >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                  )}
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold truncate">
                  {profile.name}
                </h1>
                <p className="opacity-90 truncate">{profile.email}</p>
                <span className="inline-block mt-2 bg-white/20 px-3 py-1 rounded-full text-xs font-semibold">
                {profile.role}
              </span>
              </div>
            </div>
          </div>

          {/* Upload / Take Photo Buttons */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm mb-6">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">
              📸 Profile Picture
            </h3>
            <div className="flex gap-2 flex-wrap">
              <button
                  type="button"
                  onClick={() => setShowCamera(true)}
                  disabled={uploading}
                  className={`flex-1 min-w-[200px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.2}
                >
                  <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {uploading ? "Uploading..." : "Take Photo"}
              </button>

              {profile.profilePicture && (
                  <button
                      type="button"
                      onClick={handleRemovePicture}
                      className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition"
                  >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.2}
                    >
                      <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Remove
                  </button>
              )}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              📌 Max size: 2MB • Format: JPG, PNG, GIF
            </p>
          </div>

          {success && (
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-2 rounded-lg mb-4 text-sm">
                ✅ {success}
              </div>
          )}

          {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg mb-4 text-sm">
                {error}
              </div>
          )}

          {/* Basic Info */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                📋 Basic Information
              </h2>
              {!editing ? (
                  <button
                      onClick={() => setEditing(true)}
                      className="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold transition"
                  >
                    ✏️ Edit
                  </button>
              ) : (
                  <div className="flex gap-2">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "💾 Save"}
                    </button>
                    <button
                        onClick={() => {
                          setEditing(false);
                          setForm({ name: profile.name, phone: profile.phone });
                        }}
                        className="px-4 py-1.5 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg text-sm font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Full Name
                </label>
                {editing ? (
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className={inputClass}
                    />
                ) : (
                    <p className="text-base font-semibold text-gray-800 dark:text-gray-100">
                      {profile.name}
                    </p>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Email
                </label>
                <p className="text-base font-semibold text-gray-800 dark:text-gray-100">
                  {profile.email}
                </p>
              </div>

              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Phone
                </label>
                {editing ? (
                    <input
                        type="tel"
                        inputMode="numeric"
                        maxLength="11"
                        placeholder="03XXXXXXXXX"
                        value={form.phone}
                        onChange={(e) => {
                          const numbersOnly = e.target.value.replace(/\D/g, "");
                          setForm({ ...form, phone: numbersOnly });
                        }}
                        className={inputClass}
                    />
                ) : (
                    <p className="text-base font-semibold text-gray-800 dark:text-gray-100">
                      {profile.phone}
                    </p>
                )}

                {showOtpInput && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-xs text-blue-800 dark:text-blue-300 mb-2 font-medium">
                        📱 Enter the 6-digit OTP sent to {form.phone}
                      </p>
                      <div className="flex gap-2">
                        <input
                            type="text"
                            maxLength="6"
                            placeholder="Enter OTP"
                            value={otp}
                            onChange={(e) =>
                                setOtp(e.target.value.replace(/\D/g, ""))
                            }
                            className="flex-1 px-3 py-2 border border-blue-300 rounded-lg text-center text-lg font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                        />
                        <button
                            type="button"
                            onClick={handleVerifyOtp}
                            disabled={saving}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
                        >
                          {saving ? "..." : "Verify"}
                        </button>
                      </div>
                      {otpError && (
                          <p className="text-xs text-red-600 mt-2">{otpError}</p>
                      )}
                      {otpSuccess && (
                          <p className="text-xs text-green-600 mt-2">
                            ✅ {otpSuccess}
                          </p>
                      )}
                    </div>
                )}
              </div>
            </div>
          </div>

          {/* Camera Capture Modal */}
          {showCamera && (
              <CameraCapture
                  onCapture={handleCameraCapture}
                  onCancel={() => setShowCamera(false)}
              />
          )}

          {/* Account Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm mb-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
              ⚙️ Account
            </h2>

            {/* Request History Button (Only for Customer) */}
            {profile.role === "CUSTOMER" && (
                <button
                    onClick={() => navigate("/request-history")}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 mb-3"
                >
                  📋 Request History
                </button>
            )}

            {/* Theme Toggle Button */}
            <button
                onClick={toggle}
                className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 mb-3"
            >
              {dark ? "☀️ Switch to Light Mode" : "🌙 Switch to Dark Mode"}
            </button>

            {!showPasswordForm ? (
                <button
                    onClick={() => {
                      setShowPasswordForm(true);
                      setPasswordError("");
                      setPasswordSuccess("");
                    }}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 mb-3"
                >
                  🔒 Change Password
                </button>
            ) : (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-3">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">
                    🔒 Change Password
                  </h3>

                  {passwordError && (
                      <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg mb-3 text-xs">
                        {passwordError}
                      </div>
                  )}
                  {passwordSuccess && (
                      <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-3 py-2 rounded-lg mb-3 text-xs">
                        ✅ {passwordSuccess}
                      </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        Current Password
                      </label>
                      <input
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) =>
                              setPasswordForm({
                                ...passwordForm,
                                currentPassword: e.target.value,
                              })
                          }
                          className={inputClass}
                          placeholder="Enter current password"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        New Password
                      </label>
                      <input
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) =>
                              setPasswordForm({
                                ...passwordForm,
                                newPassword: e.target.value,
                              })
                          }
                          className={inputClass}
                          placeholder="Min 6 characters"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        Confirm New Password
                      </label>
                      <input
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) =>
                              setPasswordForm({
                                ...passwordForm,
                                confirmPassword: e.target.value,
                              })
                          }
                          className={inputClass}
                          placeholder="Re-enter new password"
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                          onClick={handleChangePassword}
                          disabled={changingPassword}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
                      >
                        {changingPassword ? "Saving..." : "💾 Save Password"}
                      </button>
                      <button
                          onClick={() => {
                            setShowPasswordForm(false);
                            setPasswordForm({
                              currentPassword: "",
                              newPassword: "",
                              confirmPassword: "",
                            });
                            setPasswordError("");
                            setPasswordSuccess("");
                          }}
                          className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100 py-2 rounded-lg text-sm font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
            )}

            <button
                onClick={handleLogout}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
            >
              <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.2}
              >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
  );
}

export default Profile;