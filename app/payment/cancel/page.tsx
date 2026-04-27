"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle } from "lucide-react";

export default function PaymentCancelPage() {
    const searchParams = useSearchParams();
    const orderCode = searchParams.get("orderCode");

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-8 text-center">

                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center">
                        <XCircle className="text-orange-400" size={48} />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    Đã huỷ thanh toán
                </h1>
                <p className="text-gray-500 text-sm mb-6">
                    Bạn đã huỷ giao dịch. Không có khoản tiền nào bị trừ.
                    Bạn có thể đăng ký lại bất cứ lúc nào.
                </p>

                {orderCode && (
                    <p className="text-xs text-gray-400 mb-6">
                        Mã đơn hàng: #{orderCode}
                    </p>
                )}

                <div className="flex gap-3">
                    <Link
                        href="/courses"
                        className="flex-1 border border-gray-200 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors text-center"
                    >
                        Xem khóa học khác
                    </Link>
                    <Link
                        href="/"
                        className="flex-1 bg-[#1b61c9] hover:bg-[#1550b0] text-white font-medium py-3 rounded-xl transition-colors text-center"
                    >
                        Trang chủ
                    </Link>
                </div>
            </div>
        </div>
    );
}
