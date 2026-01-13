import Button from "./Button";

interface Props {
  totalItems: number;
  currentPage: number;
  perPage: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({
  totalItems,
  currentPage,
  perPage,
  onPageChange,
}: Props) => {
  const totalPages = Math.ceil(totalItems / perPage);

  if (totalPages === 0) return null;

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <nav aria-label="Page navigation">
      <ul className="pagination justify-content-end mb-0">
        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
          <Button
            className=""
            colorVariant="light"
            onClick={() => onPageChange(currentPage - 1)}
          >
            {"Previous"}
          </Button>
        </li>

        {pageNumbers.map((num) => (
          <li
            key={num}
            className={`page-item ${currentPage === num ? "active" : ""}`}
          >
            <Button
              className=""
              colorVariant={currentPage === num ? "dark" : "light"}
              onClick={() => onPageChange(num)}
            >
              {num}
            </Button>
          </li>
        ))}

        <li
          className={`page-item ${
            currentPage === totalPages ? "disabled" : ""
          }`}
        >
          <Button
            className=""
            colorVariant="light"
            onClick={() => onPageChange(currentPage + 1)}
          >
            {"Next"}
          </Button>
        </li>
      </ul>
    </nav>
  );
};

export default Pagination;
