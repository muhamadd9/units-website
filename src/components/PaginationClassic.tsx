import { FiChevronRight, FiChevronLeft } from "react-icons/fi";

interface Props {
    totalItems: number;
    itemsPerPage?: number;
    currentPage: number;
    onPageChange: (page: number) => void;
}

const PaginationClassic = ({ totalItems, itemsPerPage = 10, currentPage, onPageChange }: Props) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            onPageChange(page);
        }
    };

    const getVisiblePages = () => {
        const visiblePages: (number | string)[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                visiblePages.push(i);
            }
        } else {
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            visiblePages.push(1);

            if (start > 2) {
                visiblePages.push("...");
            }

            for (let i = start; i <= end; i++) {
                visiblePages.push(i);
            }

            if (end < totalPages - 1) {
                visiblePages.push("...");
            }

            visiblePages.push(totalPages);
        }

        return visiblePages;
    };

    if (totalPages <= 1) return null;

    return (
        <div className="flex justify-center mt-8">
            <div className="flex items-center gap-1">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                    <FiChevronLeft className="text-sm" />
                    Previous
                </button>

                {getVisiblePages().map((page, index) =>
                    page === "..." ? (
                        <span key={`ellipsis-${index}`} className="px-3 py-1.5 text-gray-500">
                            ...
                        </span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => handlePageChange(page as number)}
                            className={`px-3 py-1.5 rounded-lg border ${currentPage === page
                                ? "bg-[#383E50] border-[#383E50] text-white"
                                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                                }`}
                        >
                            {page}
                        </button>
                    )
                )}

                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                    Next
                    <FiChevronRight className="text-sm" />
                </button>
            </div>
        </div>
    );
};

export default PaginationClassic;
