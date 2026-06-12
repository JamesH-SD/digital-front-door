type AdminPageHeaderProps = {
    title: string;
    description?: string;
  };
  
  export default function AdminPageHeader({
    title,
    description,
  }: AdminPageHeaderProps) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-gray-950">{title}</h1>
  
        {description ? (
          <p className="mt-1 max-w-4xl text-sm leading-6 text-gray-500">
            {description}
          </p>
        ) : null}
      </div>
    );
  }