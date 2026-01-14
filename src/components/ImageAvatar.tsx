interface ImageAvatarProps {
  image?: string;
  src?: string; // optional alias
  size?: number;
}

const ImageAvatar: React.FC<ImageAvatarProps> = ({ image, src, size = 40 }) => {
  const avatarSrc = image || src; // prioritize `image`, fallback to `src`
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        backgroundColor: "#ccc",
        display: "inline-block",
      }}
    >
      {avatarSrc ? (
        <img
          src={avatarSrc}
          alt="avatar"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : null}
    </div>
  );
};

export default ImageAvatar
