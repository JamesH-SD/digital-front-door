import Image from "next/image";

type Props = {
  variant?: "logo" | "icon";
  className?: string;
  priority?: boolean;
};

export default function BrandLogo({
  variant = "logo",
  className = "",
  priority = false,
}: Props) {
  const isIcon = variant === "icon";

  return (
    <Image
      src={isIcon ? "/branding/contactor-icon.png" : "/branding/contactor-logo.png"}
      alt="Contactor"
      width={isIcon ? 64 : 360}
      height={isIcon ? 64 : 90}
      priority={priority}
      className={className || (isIcon ? "h-8 w-8" : "h-auto w-[220px]")}
    />
  );
}