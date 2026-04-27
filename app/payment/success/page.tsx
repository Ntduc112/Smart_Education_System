"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import api from "@/lib/axios";

type Status = "loading" | "paid" | "pending" | "failed";

interface PaymentInfo {
    status: string;
    course_id: string;
    amount: string;
}

export default function PaymentSuccessPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderCode = searchParams.get("orderCode");
    const code = searchParams.get("code"); // "00" = success from PayOS redirect

    const [status, setStatus] = useState<Status>("loading");
    const [payment, setPayment] = useState<PaymentInfo | null>(null);
    const [attempts, setAttempts] = useState(0);

    useEffect(() => {
        if (!orderCode) {
            setStatus("failed");
            return;
        }

        // PayOS redirect với code !== "00" nghĩa là thất bại
        if (code && code !== "00") {
            setStatus("failed");
            return;
        }

        let cancelled = false;

        async function checkStatus() {
            try {
                const res = await api.get(`/payment/status/${orderCode}`);
                const p: PaymentInfo = res.data.payment;
                if (cancelled) return;

                if (p.status === "PAID") {
                    setPayment(p);
                    setStatus("paid");
                } else if (p.status === "FAILED") {
                    setStatus("failed");
                } else {
                    // PENDING — webhook chưa về, poll thêm
                    setStatus("pending");
                    setAttempts((a) => a + 1);
                }
            } catch {
                if (!cancelled) setStatus("failed");
            }
        }

        checkStatus();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderCode, code]);

    // Poll mỗi 2 giây khi PENDING, tối đa 10 lần
    useEffect(() => {
        if (status !== "pending" || attempts >= 10 || !orderCode) return;

        const timer = setTimeout(async () => {
            try {
                const res = await api.get(`/payment/status/${orderCode}`);
                const p: PaymentInfo = res.data.payment;
                if (p.status === "PAID") {
                    setPayment(p);
                    setStatus("paid");
                } else if (p.status === "FAILED") {
                    setStatus("failed");
                } else {
                    setAttempts((a) => a + 1);
                }
            } catch {
                setStatus("failed");
            }
        }, 2000);

        return () => clearTimeout(timer);
    }, [status, attempts, orderCode]);

    // Tự động redirect sang trang học sau 4 giây nếu PAID
    useEffect(() => {
        if (status !== "paid" || !payment?.course_id) return;
        const timer = setTimeout(() => {
            router.push(`/student/courses/${payment.course_id}/learn`);
        }, 4000);
        return () => clearTimeout(timer);
    }, [status, payment, router]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-8 text-center">

                {/* Loading */}
                {(status === "loading" || status === "pending") && (
                    <>
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
                                <Loader2 className="text-blue-500 animate-spin" size={40} />
                            </div>
                        </div>
                        <h1 className="text-xl font-semibold text-gray-800 mb-2">
                            Đang xác nhận thanh toán
                        </h1>
                        <p className="text-gray-500 text-sm">
                            Vui lòng chờ trong giây lát, hệ thống đang xác nhận giao dịch của bạn...
                        </p>
                        {status === "pending" && attempts > 2 && (
                            <p className="text-gray-400 text-xs mt-3">
                                Đang chờ phản hồi từ ngân hàng ({attempts}/10)
                            </p>
                        )}
                    </>
                )}

                {/* Success */}
                {status === "paid" && (
                    <>
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
                                <CheckCircle2 className="text-green-500" size={48} />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">
                            Thanh toán thành công!
                        </h1>
                        <p className="text-gray-500 text-sm mb-6">
                            Bạn đã đăng ký khóa học thành công. Trang học sẽ mở sau vài giây...
                        </p>

                        {payment && (
                            <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6 text-left">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Mã đơn hàng</span>
                                    <span className="font-medium text-gray-700">#{orderCode}</span>
                                </div>
                                <div className="flex justify-between text-sm mt-2">
                                    <span className="text-gray-500">Số tiền</span>
                                    <span className="font-semibold text-green-600">
                                        {Number(payment.amount).toLocaleString("vi-VN")} ₫
                                    </span>
                                </div>
                            </div>
                        )}

                        <Link
                            href={`/student/courses/${payment?.course_id}/learn`}
                            className="block w-full bg-[#1b61c9] hover:bg-[#1550b0] text-white font-medium py-3 rounded-xl transition-colors"
                        >
                            Vào học ngay
                        </Link>
                    </>
                )}

                {/* Failed / timeout */}
                {(status === "failed" || (status === "pending" && attempts >= 10)) && (
                    <>
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
                                <XCircle className="text-red-400" size={48} />
                            </div>
                        </div>
                        <h1 className="text-xl font-semibold text-gray-800 mb-2">
                            Thanh toán không thành công
                        </h1>
                        <p className="text-gray-500 text-sm mb-6">
                            Giao dịch không được xác nhận. Vui lòng thử lại hoặc liên hệ hỗ trợ.
                        </p>
                        <div className="flex gap-3">
                            <Link
                                href="/courses"
                                className="flex-1 border border-gray-200 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Về danh sách khóa học
                            </Link>
                            <Link
                                href="/"
                                className="flex-1 bg-[#1b61c9] hover:bg-[#1550b0] text-white font-medium py-3 rounded-xl transition-colors"
                            >
                                Trang chủ
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
