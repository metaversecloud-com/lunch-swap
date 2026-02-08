export const Loading = () => {
  return (
    <div className="container my-6" role="status" aria-label="Loading">
      <img
        alt=""
        aria-hidden="true"
        src="https://sdk-style.s3.amazonaws.com/icons/loading.svg"
        style={{ margin: "auto", width: 50, height: 50 }}
      />
      <span className="sr-only">Loading...</span>
    </div>
  );
};
