import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import "../../styles/ContactInbox.css";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const filters = [
    { value: "", label: "All messages" },
    { value: "new", label: "New" },
    { value: "in_progress", label: "In progress" },
    { value: "resolved", label: "Resolved" },
];

function ContactInbox() {
    const [messages, setMessages] = useState([]);
    const [statusFilter, setStatusFilter] = useState("");
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState("");
    const [feedback, setFeedback] = useState({
        type: "",
        text: "",
    });

    function authHeaders() {
        return {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        };
    }

    async function loadMessages(filter = statusFilter) {
        setLoading(true);
        setFeedback({ type: "", text: "" });

        try {
            const query = filter
                ? `?status=${encodeURIComponent(filter)}`
                : "";

            const response = await fetch(
                `${API_BASE_URL}/api/admin/contact-messages${query}`,
                {
                    headers: authHeaders(),
                }
            );

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    result.message || "Could not load contact messages."
                );
            }

            setMessages(
                Array.isArray(result.data) ? result.data : []
            );
        } catch (error) {
            setFeedback({
                type: "error",
                text:
                    error.message ||
                    "Could not load contact messages.",
            });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadMessages(statusFilter);
    }, [statusFilter]);

    async function updateStatus(messageId, status) {
        setUpdatingId(messageId);
        setFeedback({ type: "", text: "" });

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/admin/contact-messages/${messageId}/status`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        ...authHeaders(),
                    },
                    body: JSON.stringify({ status }),
                }
            );

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    result.message ||
                    "Could not update message status."
                );
            }

            setFeedback({
                type: "success",
                text: "Message status updated.",
            });

            await loadMessages(statusFilter);
        } catch (error) {
            setFeedback({
                type: "error",
                text:
                    error.message ||
                    "Could not update message status.",
            });
        } finally {
            setUpdatingId("");
        }
    }

    function replyByEmail(message) {
        const email = message.email?.trim();

        if (!email) {
            setFeedback({
                type: "error",
                text: "This contact message does not have a customer email address.",
            });
            return;
        }

        const subject = `Re: ${message.subject || "Your AquaCart enquiry"}`;

        const gmailUrl =
            "https://mail.google.com/mail/?" +
            new URLSearchParams({
                view: "cm",
                fs: "1",
                to: email,
                su: subject,
            }).toString();

        window.open(
            gmailUrl,
            "_blank",
            "noopener,noreferrer"
        );
    }

    function formatDate(value) {
        if (!value) return "—";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) return "—";

        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function categoryLabel(category) {
        return (
            {
                general: "General question",
                order: "Order or delivery",
                product: "Product question",
                return: "Return or warranty",
                payment: "Payment issue",
                technical: "Website problem",
                other: "Other",
            }[category] || "General question"
        );
    }

    function statusLabel(status) {
        return (
            {
                new: "New",
                in_progress: "In progress",
                resolved: "Resolved",
            }[status] || status
        );
    }

    return (
        <AdminLayout pageTitle="Contact Inbox">
            <div className="contact-inbox-page">
                <div className="contact-inbox-heading">
                    <div>
                        <span className="contact-inbox-eyebrow">
                            CUSTOMER SUPPORT
                        </span>

                        <h2>Contact messages</h2>

                        <p>
                            Review questions and issues submitted
                            through the customer Contact Us form.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="contact-inbox-refresh"
                        onClick={() => loadMessages(statusFilter)}
                        disabled={loading}
                    >
                        ↻ Refresh
                    </button>
                </div>

                <div className="contact-inbox-summary">
                    <div>
                        <span>Total shown</span>
                        <strong>{messages.length}</strong>
                    </div>

                    <div>
                        <span>New</span>
                        <strong>
                            {
                                messages.filter(
                                    (item) => item.status === "new"
                                ).length
                            }
                        </strong>
                    </div>

                    <div>
                        <span>In progress</span>
                        <strong>
                            {
                                messages.filter(
                                    (item) =>
                                        item.status === "in_progress"
                                ).length
                            }
                        </strong>
                    </div>

                    <div>
                        <span>Resolved</span>
                        <strong>
                            {
                                messages.filter(
                                    (item) =>
                                        item.status === "resolved"
                                ).length
                            }
                        </strong>
                    </div>
                </div>

                <div
                    className="contact-inbox-filters"
                    aria-label="Filter contact messages"
                >
                    {filters.map((filter) => (
                        <button
                            key={filter.value || "all"}
                            type="button"
                            className={
                                statusFilter === filter.value
                                    ? "contact-inbox-filter active"
                                    : "contact-inbox-filter"
                            }
                            onClick={() =>
                                setStatusFilter(filter.value)
                            }
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>

                {feedback.text && (
                    <div
                        className={`contact-inbox-feedback ${feedback.type}`}
                        role="status"
                    >
                        {feedback.text}
                    </div>
                )}

                {loading ? (
                    <div className="contact-inbox-empty">
                        Loading contact messages…
                    </div>
                ) : messages.length === 0 ? (
                    <div className="contact-inbox-empty">
                        <span aria-hidden="true">✉</span>
                        <h3>No messages here</h3>
                        <p>
                            New customer submissions will appear
                            in this inbox.
                        </p>
                    </div>
                ) : (
                    <div className="contact-message-list">
                        {messages.map((message) => (
                            <article
                                className="contact-message-card"
                                key={message._id}
                            >
                                <div className="contact-message-topline">
                                    <div>
                                        <span
                                            className={`contact-message-status status-${message.status}`}
                                        >
                                            {statusLabel(message.status)}
                                        </span>

                                        <span className="contact-message-category">
                                            {categoryLabel(message.category)}
                                        </span>
                                    </div>

                                    <time>
                                        {formatDate(message.createdAt)}
                                    </time>
                                </div>

                                <h3>{message.subject}</h3>

                                <div className="contact-message-sender">
                                    <strong>{message.name}</strong>

                                    <a
                                        href={`mailto:${message.email}`}
                                    >
                                        {message.email}
                                    </a>

                                    {message.orderReference && (
                                        <span>
                                            Order: {message.orderReference}
                                        </span>
                                    )}
                                </div>

                                <p className="contact-message-body">
                                    {message.message}
                                </p>

                                <div className="contact-message-actions">
                                    <label>
                                        Status

                                        <select
                                            value={message.status}
                                            disabled={
                                                updatingId === message._id
                                            }
                                            onChange={(event) =>
                                                updateStatus(
                                                    message._id,
                                                    event.target.value
                                                )
                                            }
                                        >
                                            <option value="new">
                                                New
                                            </option>

                                            <option value="in_progress">
                                                In progress
                                            </option>

                                            <option value="resolved">
                                                Resolved
                                            </option>
                                        </select>
                                    </label>

                                    <button
                                        type="button"
                                        className="contact-reply-link"
                                        onClick={() =>
                                            replyByEmail(message)
                                        }
                                    >
                                        Reply by email ↗
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

export default ContactInbox;