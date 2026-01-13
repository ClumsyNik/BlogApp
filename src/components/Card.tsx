interface Props {
  image?: string;
  title: string;
  content: string;
  actions?: React.ReactNode;
  className?: string;
  idBadge?: string | number;
  onTitleClick?: () => void;
}

const Card = ({ image, title, content, actions, className, idBadge, onTitleClick }: Props) => {
  return (
    <div className={`simple-card h-100 ${className || ""}`}>

      <div className="card-media mb-3" onClick={onTitleClick} style={{ cursor: 'pointer' }}>
        {image ? (
          <img src={image} className="media-img" alt={title} />
        ) : (
          <div className="media-placeholder">{title[0]}</div>
        )}
      </div>


      <div className="card-body-custom d-flex flex-column">
        <h3 className="h5 fw-bold text-dark mb-2 title-link" onClick={onTitleClick}>
          {title}
        </h3>

        <p className="text-muted small line-clamp-2 mb-3 flex-grow-1">
          {content}
        </p>


        <div className="pt-3 border-top d-flex justify-content-between align-items-center">
          {idBadge && <span className="id-badge">#{idBadge}</span>}
          {actions && (
            <div className="action-group d-flex gap-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Card;