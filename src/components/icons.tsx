import { cn } from "@/lib/utils";

/*
 * v3 디자인 시스템 「v2/Icon」 24px 선 아이콘(선 1.75).
 * 경로는 디자인에서 내보낸 SVG 그대로이고, 색만 currentColor로 바꿔 글자 색(text-*)을 따르게 했다.
 * 디자인은 아이콘을 16·20·28px로 써도 선을 1.75px로 유지해서 non-scaling-stroke로 맞춘다.
 */

type IconProps = React.ComponentProps<"svg">;

function SvgIcon({ children, className, ...props }: IconProps) {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("[&_path]:[vector-effect:non-scaling-stroke]", className)}
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconAlert(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M20.5 12C20.5 16.6944 16.6944 20.5 12 20.5C7.30558 20.5 3.5 16.6944 3.5 12C3.5 7.30558 7.30558 3.5 12 3.5C16.6944 3.5 20.5 7.30558 20.5 12Z" />
      <path d="M12 8V12.5M12 16H12.01" />
    </SvgIcon>
  );
}

export function IconBack(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M15 18L9 12L15 6" />
    </SvgIcon>
  );
}

export function IconBarcode(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M4 8V6C4 5.46957 4.21071 4.96086 4.58579 4.58579C4.96086 4.21071 5.46957 4 6 4H8M16 4H18C18.5304 4 19.0391 4.21071 19.4142 4.58579C19.7893 4.96086 20 5.46957 20 6V8M20 16V18C20 18.5304 19.7893 19.0391 19.4142 19.4142C19.0391 19.7893 18.5304 20 18 20H16M8 20H6C5.46957 20 4.96086 19.7893 4.58579 19.4142C4.21071 19.0391 4 18.5304 4 18V16" />
      <path d="M8 9V15M11 9V15M14 9V15M17 9V15" />
    </SvgIcon>
  );
}

export function IconBell(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M10.2 20C10.3638 20.3381 10.6195 20.6233 10.9378 20.8229C11.2562 21.0224 11.6243 21.1282 12 21.1282C12.3757 21.1282 12.7438 21.0224 13.0622 20.8229C13.3805 20.6233 13.6362 20.3381 13.8 20M6.5 9.5C6.5 8.04131 7.07946 6.64236 8.11091 5.61091C9.14236 4.57946 10.5413 4 12 4C13.4587 4 14.8576 4.57946 15.8891 5.61091C16.9205 6.64236 17.5 8.04131 17.5 9.5C17.5 15 20 17 20 17H4C4 17 6.5 15 6.5 9.5Z" />
    </SvgIcon>
  );
}

export function IconCamera(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M14.5 4H9.5L7.5 7H4.5C4.10218 7 3.72064 7.15804 3.43934 7.43934C3.15804 7.72064 3 8.10218 3 8.5V18.5C3 18.8978 3.15804 19.2794 3.43934 19.5607C3.72064 19.842 4.10218 20 4.5 20H19.5C19.8978 20 20.2794 19.842 20.5607 19.5607C20.842 19.2794 21 18.8978 21 18.5V8.5C21 8.10218 20.842 7.72064 20.5607 7.43934C20.2794 7.15804 19.8978 7 19.5 7H16.5L14.5 4Z" />
      <path d="M15.5 13C15.5 14.933 13.933 16.5 12 16.5C10.067 16.5 8.5 14.933 8.5 13C8.5 11.067 10.067 9.5 12 9.5C13.933 9.5 15.5 11.067 15.5 13Z" />
    </SvgIcon>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M5 12.5L9.5 17L19 7.5" />
    </SvgIcon>
  );
}

export function IconChevronDown(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M6 9L12 15L18 9" />
    </SvgIcon>
  );
}

export function IconChevronRight(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M9 18L15 12L9 6" />
    </SvgIcon>
  );
}

export function IconClose(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M18 6L12 12M12 12L6 18M12 12L6 6M12 12L18 18" />
    </SvgIcon>
  );
}

export function IconCompare(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M5.5 4.5H18.5C19.6046 4.5 20.5 5.39543 20.5 6.5V17.5C20.5 18.6046 19.6046 19.5 18.5 19.5H5.5C4.39543 19.5 3.5 18.6046 3.5 17.5V6.5C3.5 5.39543 4.39543 4.5 5.5 4.5Z" />
      <path d="M12 4.5V19.5" />
    </SvgIcon>
  );
}

export function IconCopy(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M10 8H18C19.1046 8 20 8.89543 20 10V18C20 19.1046 19.1046 20 18 20H10C8.89543 20 8 19.1046 8 18V10C8 8.89543 8.89543 8 10 8Z" />
      <path d="M16 8V6C16 5.46957 15.7893 4.96086 15.4142 4.58579C15.0391 4.21071 14.5304 4 14 4H6C5.46957 4 4.96086 4.21071 4.58579 4.58579C4.21071 4.96086 4 5.46957 4 6V14C4 14.5304 4.21071 15.0391 4.58579 15.4142C4.96086 15.7893 5.46957 16 6 16H8" />
    </SvgIcon>
  );
}

export function IconDoc(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M18.5 8L14 3.5H7C6.60218 3.5 6.22064 3.65804 5.93934 3.93934C5.65804 4.22064 5.5 4.60218 5.5 5V19C5.5 19.3978 5.65804 19.7794 5.93934 20.0607C6.22064 20.342 6.60218 20.5 7 20.5H17C17.3978 20.5 17.7794 20.342 18.0607 20.0607C18.342 19.7794 18.5 19.3978 18.5 19V8ZM14 3.5V8H18.5M9 13H15M9 16.5H13" />
    </SvgIcon>
  );
}

export function IconDownload(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M12 4V15M16.5 10.5L12 15L7.5 10.5M5 19.5H19" />
    </SvgIcon>
  );
}

export function IconEdit(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M15.5 5.5L18.5 8.5M15.5 5.5L5 16L4 20L8 19L18.5 8.5M15.5 5.5L16 5L19 8L18.5 8.5" />
    </SvgIcon>
  );
}

export function IconExternal(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M20 10V4H14M20 4L11 13M18 14V19C18 19.2652 17.8946 19.5196 17.7071 19.7071C17.5196 19.8946 17.2652 20 17 20H5C4.73478 20 4.48043 19.8946 4.29289 19.7071C4.10536 19.5196 4 19.2652 4 19V7C4 6.73478 4.10536 6.48043 4.29289 6.29289C4.48043 6.10536 4.73478 6 5 6H10" />
    </SvgIcon>
  );
}

export function IconFilter(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M4 7H13M17 7H20M4 12H7M11 12H20M4 17H15M19 17H20" />
      <path d="M17 7C17 8.10457 16.1046 9 15 9C13.8954 9 13 8.10457 13 7C13 5.89543 13.8954 5 15 5C16.1046 5 17 5.89543 17 7Z" />
      <path d="M11 12C11 13.1046 10.1046 14 9 14C7.89543 14 7 13.1046 7 12C7 10.8954 7.89543 10 9 10C10.1046 10 11 10.8954 11 12Z" />
      <path d="M19 17C19 18.1046 18.1046 19 17 19C15.8954 19 15 18.1046 15 17C15 15.8954 15.8954 15 17 15C18.1046 15 19 15.8954 19 17Z" />
    </SvgIcon>
  );
}

export function IconFlag(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M5 21V12.5M5 12.5V4.5H16.5L14 8.5L16.5 12.5H5Z" />
    </SvgIcon>
  );
}

export function IconFlash(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M13 3L5 13.5H11.5L11 21L19 10.5H12.5L13 3Z" />
    </SvgIcon>
  );
}

export function IconHash(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M5 9H9.375M9.375 9H15.375M9.375 9L10 4M9.375 9L8.625 15M15.375 9H19M15.375 9L16 4M15.375 9L14.625 15M5 15H8.625M8.625 15H14.625M8.625 15L8 20M14.625 15H19M14.625 15L14 20" />
    </SvgIcon>
  );
}

export function IconHeartFill(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path
        d="M12 20C12 20 4.5 15.6 4.5 10C4.61235 9.18667 4.94507 8.41958 5.46214 7.78181C5.97921 7.14403 6.66092 6.65987 7.43343 6.38176C8.20595 6.10366 9.03983 6.04221 9.84477 6.20406C10.6497 6.36592 11.395 6.74491 12 7.3C12.605 6.74491 13.3503 6.36592 14.1552 6.20406C14.9602 6.04221 15.794 6.10366 16.5666 6.38176C17.3391 6.65987 18.0208 7.14403 18.5379 7.78181C19.0549 8.41958 19.3877 9.18667 19.5 10C19.5 15.6 12 20 12 20Z"
        fill="currentColor"
      />
    </SvgIcon>
  );
}

export function IconHeart(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M12 20C12 20 4.5 15.6 4.5 10C4.61235 9.18667 4.94507 8.41958 5.46214 7.78181C5.97921 7.14403 6.66092 6.65987 7.43343 6.38176C8.20595 6.10366 9.03983 6.04221 9.84477 6.20406C10.6497 6.36592 11.395 6.74491 12 7.3C12.605 6.74491 13.3503 6.36592 14.1552 6.20406C14.9602 6.04221 15.794 6.10366 16.5666 6.38176C17.3391 6.65987 18.0208 7.14403 18.5379 7.78181C19.0549 8.41958 19.3877 9.18667 19.5 10C19.5 15.6 12 20 12 20Z" />
    </SvgIcon>
  );
}

export function IconHelp(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M20.5 12C20.5 16.6944 16.6944 20.5 12 20.5C7.30558 20.5 3.5 16.6944 3.5 12C3.5 7.30558 7.30558 3.5 12 3.5C16.6944 3.5 20.5 7.30558 20.5 12Z" />
      <path d="M9.6 9.5C9.81775 8.98064 10.2045 8.55001 10.6975 8.27788C11.1906 8.00576 11.7611 7.90807 12.3166 8.00066C12.8721 8.09324 13.38 8.37067 13.7582 8.78799C14.1363 9.20532 14.3625 9.73809 14.4 10.3C14.4 12 12 12.5 12 14M12 16.5H12.01" />
    </SvgIcon>
  );
}

export function IconHome(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M4 10.5L12 4L20 10.5V19C20 19.2652 19.8946 19.5196 19.7071 19.7071C19.5196 19.8946 19.2652 20 19 20H14.5V14.5H9.5V20H5C4.73478 20 4.48043 19.8946 4.29289 19.7071C4.10536 19.5196 4 19.2652 4 19V10.5Z" />
    </SvgIcon>
  );
}

export function IconImage(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M5.5 4.5H18.5C19.6046 4.5 20.5 5.39543 20.5 6.5V17.5C20.5 18.6046 19.6046 19.5 18.5 19.5H5.5C4.39543 19.5 3.5 18.6046 3.5 17.5V6.5C3.5 5.39543 4.39543 4.5 5.5 4.5Z" />
      <path d="M10.8 10C10.8 10.9941 9.99411 11.8 9 11.8C8.00589 11.8 7.2 10.9941 7.2 10C7.2 9.00589 8.00589 8.2 9 8.2C9.99411 8.2 10.8 9.00589 10.8 10Z" />
      <path d="M20.5 16L16 11.5L7 19.5" />
    </SvgIcon>
  );
}

export function IconInfo(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M20.5 12C20.5 16.6944 16.6944 20.5 12 20.5C7.30558 20.5 3.5 16.6944 3.5 12C3.5 7.30558 7.30558 3.5 12 3.5C16.6944 3.5 20.5 7.30558 20.5 12Z" />
      <path d="M12 11V16M12 8H12.01" />
    </SvgIcon>
  );
}

export function IconLogout(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M10 20H5.5C5.10218 20 4.72064 19.842 4.43934 19.5607C4.15804 19.2794 4 18.8978 4 18.5V5.5C4 5.10218 4.15804 4.72064 4.43934 4.43934C4.72064 4.15804 5.10218 4 5.5 4H10M15 8L19 12L15 16M19 12H9" />
    </SvgIcon>
  );
}

export function IconMinusCircle(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M20.5 12C20.5 16.6944 16.6944 20.5 12 20.5C7.30558 20.5 3.5 16.6944 3.5 12C3.5 7.30558 7.30558 3.5 12 3.5C16.6944 3.5 20.5 7.30558 20.5 12Z" />
      <path d="M8.5 12H15.5" />
    </SvgIcon>
  );
}

export function IconMinus(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M5 12H19" />
    </SvgIcon>
  );
}

export function IconMy(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M15.5 8.5C15.5 10.433 13.933 12 12 12C10.067 12 8.5 10.433 8.5 8.5C8.5 6.567 10.067 5 12 5C13.933 5 15.5 6.567 15.5 8.5Z" />
      <path d="M5 20C5.8 16.4 8.6 14.5 12 14.5C15.4 14.5 18.2 16.4 19 20" />
    </SvgIcon>
  );
}

export function IconPlusCircle(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M20.5 12C20.5 16.6944 16.6944 20.5 12 20.5C7.30558 20.5 3.5 16.6944 3.5 12C3.5 7.30558 7.30558 3.5 12 3.5C16.6944 3.5 20.5 7.30558 20.5 12Z" />
      <path d="M12 8.5V12M12 12V15.5M12 12H8.5M12 12H15.5" />
    </SvgIcon>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M12 5V12M12 12V19M12 12H5M12 12H19" />
    </SvgIcon>
  );
}

export function IconRanking(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M5 20V13M12 20V5M19 20V10" />
    </SvgIcon>
  );
}

export function IconRecord(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12Z" />
      <path d="M12 8V12.5L15 14.5" />
    </SvgIcon>
  );
}

export function IconRefresh(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M20 11C19.9801 9.15036 19.3198 7.36478 18.1316 5.94715C16.9434 4.52953 15.3006 3.56746 13.4829 3.2247C11.6652 2.88194 9.78485 3.17966 8.16194 4.0672C6.53903 4.95474 5.27382 6.37724 4.58166 8.0926C3.8895 9.80796 3.81315 11.7102 4.36561 13.4755C4.91807 15.2408 6.06519 16.7601 7.61175 17.7749C9.15831 18.7896 11.0087 19.2371 12.8481 19.0411C14.6874 18.8451 16.402 18.0178 17.7 16.7M14 11H20V5" />
    </SvgIcon>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M18 11C18 14.866 14.866 18 11 18C7.13401 18 4 14.866 4 11C4 7.13401 7.13401 4 11 4C14.866 4 18 7.13401 18 11Z" />
      <path d="M20 20L16 16" />
    </SvgIcon>
  );
}

export function IconShare(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M12 3V15M16 7L12 3L8 7M5 12V19C5 19.2652 5.10536 19.5196 5.29289 19.7071C5.48043 19.8946 5.73478 20 6 20H18C18.2652 20 18.5196 19.8946 18.7071 19.7071C18.8946 19.5196 19 19.2652 19 19V12" />
    </SvgIcon>
  );
}

export function IconSort(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M7 5V19M10 16L7 19L4 16M17 19V5M20 8L17 5L14 8" />
    </SvgIcon>
  );
}

export function IconStore(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M4.5 9.5V20H9.5M4.5 9.5H4L5.5 4.5H18.5L20 9.5H19.5M4.5 9.5H19.5M9.5 20H14.5M9.5 20V15H14.5V20M14.5 20H19.5V9.5" />
    </SvgIcon>
  );
}

export function IconTrash(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M4 7H6.5M6.5 7H9.5M6.5 7L7.3 19C7.3 19.3978 7.45804 19.7794 7.73934 20.0607C8.02064 20.342 8.40218 20.5 8.8 20.5H15.2C15.5978 20.5 15.9794 20.342 16.2607 20.0607C16.542 19.7794 16.7 19.3978 16.7 19L17.5 7M9.5 7H14.5M9.5 7V4.5H14.5V7M14.5 7H17.5M17.5 7H20M10 11V17M14 11V17" />
    </SvgIcon>
  );
}
