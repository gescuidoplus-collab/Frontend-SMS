import React from "react";
import { Typography } from "antd";

interface PageHeaderProps {
  title: string;
  description?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description }) => (
  <div style={{ marginBottom: 24 }}>
    <Typography.Title level={3} style={{ marginBottom: 0 }}>
      {title}
    </Typography.Title>
    {description && (
      <Typography.Text type="secondary">{description}</Typography.Text>
    )}
  </div>
);

export default PageHeader;
