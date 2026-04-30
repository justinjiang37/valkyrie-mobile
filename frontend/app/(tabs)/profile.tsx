import React, { useState, useCallback } from "react";
import {
  ScrollView, Text, View, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, TextInput, LayoutChangeEvent, Switch, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path, Circle } from "react-native-svg";
import { useApp } from "../../src/context/AppContext";
import { useAuth } from "../../src/context/AuthContext";
import { Colors } from "../../src/constants/theme";
import { type } from "../../src/constants/typography";
import { Feather } from "@expo/vector-icons";

function MoonIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path d="M18.2454 11.1117C18.1652 11.0314 18.0647 10.9744 17.9546 10.9469C17.8445 10.9193 17.7289 10.9223 17.6204 10.9555C16.4286 11.3158 15.1615 11.346 13.9539 11.0429C12.7464 10.7398 11.6437 10.1148 10.7633 9.23442C9.88296 8.35406 9.25794 7.25136 8.95486 6.0438C8.65178 4.83625 8.68198 3.56909 9.04226 2.37735C9.0757 2.26875 9.0789 2.1531 9.05153 2.04282C9.02415 1.93255 8.96723 1.83182 8.88688 1.75148C8.80654 1.67113 8.70581 1.61421 8.59554 1.58683C8.48526 1.55946 8.36961 1.56266 8.26101 1.5961C6.61338 2.10082 5.1669 3.11234 4.12742 4.48672C3.21837 5.69364 2.66387 7.13014 2.52622 8.63482C2.38857 10.1395 2.67323 11.6528 3.34821 13.0046C4.02319 14.3564 5.06175 15.4933 6.34721 16.2874C7.63267 17.0815 9.11411 17.5014 10.6251 17.5C12.3878 17.5054 14.1037 16.9324 15.5095 15.8688C16.8838 14.8293 17.8954 13.3828 18.4001 11.7352C18.4331 11.627 18.4362 11.5118 18.409 11.402C18.3817 11.2923 18.3252 11.1919 18.2454 11.1117ZM14.7579 14.8703C13.4341 15.8674 11.7947 16.3527 10.1414 16.237C8.4882 16.1212 6.93242 15.4121 5.7605 14.2403C4.58857 13.0685 3.87939 11.5128 3.76349 9.85953C3.6476 8.2063 4.13279 6.56685 5.12976 5.24297C5.7793 4.38521 6.61903 3.68988 7.58289 3.21172C7.52798 3.59705 7.50031 3.98578 7.50008 4.375C7.50235 6.52919 8.35911 8.59449 9.88235 10.1177C11.4056 11.641 13.4709 12.4977 15.6251 12.5C16.0151 12.4999 16.4046 12.4722 16.7907 12.4172C16.3121 13.3812 15.6162 14.221 14.7579 14.8703Z" fill="#2B2923" />
    </Svg>
  );
}

function PerHorseIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path d="M10.6251 7.8125C10.6251 7.99792 10.5701 8.17918 10.4671 8.33335C10.3641 8.48752 10.2177 8.60768 10.0464 8.67864C9.87505 8.74959 9.68655 8.76816 9.50469 8.73199C9.32283 8.69581 9.15579 8.60652 9.02468 8.47541C8.89356 8.3443 8.80428 8.17725 8.7681 7.9954C8.73193 7.81354 8.75049 7.62504 8.82145 7.45373C8.89241 7.28243 9.01257 7.13601 9.16674 7.033C9.32091 6.92998 9.50217 6.875 9.68759 6.875C9.93623 6.875 10.1747 6.97377 10.3505 7.14959C10.5263 7.3254 10.6251 7.56386 10.6251 7.8125ZM18.1251 10.1156C18.0899 12.2205 17.2414 14.2301 15.7573 15.7232C14.2732 17.2163 12.2688 18.077 10.1642 18.125H9.99462C8.00209 18.139 6.07479 17.4155 4.58368 16.0938C4.45936 15.9832 4.38405 15.8278 4.3743 15.6617C4.36948 15.5795 4.3809 15.4971 4.40791 15.4193C4.43492 15.3415 4.47699 15.2698 4.53173 15.2082C4.58646 15.1466 4.65279 15.0965 4.72691 15.0605C4.80104 15.0246 4.88151 15.0036 4.96374 14.9988C5.12982 14.9891 5.29296 15.0457 5.41728 15.1562C5.88816 15.5776 6.41697 15.9294 6.98759 16.2008L9.06259 13.3469C7.2829 12.5789 5.35399 12.9055 4.26571 13.0898C3.80512 13.1694 3.33143 13.1176 2.89894 12.9403C2.46644 12.763 2.09265 12.4674 1.8204 12.0875L1.79696 12.0539L0.720401 10.3352C0.676743 10.2653 0.647338 10.1874 0.63388 10.1061C0.620421 10.0248 0.623174 9.94166 0.64198 9.86142C0.660786 9.78119 0.695274 9.70546 0.743459 9.63861C0.791644 9.57175 0.852575 9.51509 0.922744 9.47187L8.75009 4.65078V2.5C8.75009 2.33424 8.81594 2.17527 8.93315 2.05806C9.05036 1.94085 9.20933 1.875 9.37509 1.875H10.0001C11.0769 1.87489 12.1429 2.08882 13.1363 2.50435C14.1297 2.91988 15.0306 3.52872 15.7866 4.29549C16.5426 5.06226 17.1387 5.97165 17.5401 6.9708C17.9416 7.96996 18.1404 9.03894 18.1251 10.1156ZM16.8751 10.0984C16.8881 9.18735 16.7199 8.28276 16.3803 7.43725C16.0406 6.59174 15.5363 5.82218 14.8966 5.17332C14.2569 4.52445 13.4946 4.00922 12.654 3.65758C11.8134 3.30594 10.9113 3.12491 10.0001 3.125V5C10 5.10672 9.97263 5.21164 9.92053 5.30477C9.86842 5.3979 9.79334 5.47614 9.70243 5.53203L2.11415 10.2023L2.8454 11.3742C2.98332 11.5599 3.17029 11.7035 3.38531 11.7888C3.60033 11.8741 3.83487 11.8977 4.06259 11.857C5.31259 11.6461 7.87275 11.2133 10.1618 12.4961C10.9612 12.4535 11.7139 12.1063 12.2651 11.5257C12.8162 10.9452 13.124 10.1755 13.1251 9.375C13.1251 9.20924 13.1909 9.05027 13.3081 8.93306C13.4254 8.81585 13.5843 8.75 13.7501 8.75C13.9158 8.75 14.0748 8.81585 14.192 8.93306C14.3092 9.05027 14.3751 9.20924 14.3751 9.375C14.3736 10.478 13.956 11.5398 13.2058 12.3484C12.4556 13.1569 11.428 13.6527 10.3282 13.7367L8.21024 16.6492C8.83984 16.8125 9.48888 16.8884 10.1392 16.875C11.9196 16.8335 13.615 16.105 14.8705 14.8419C16.126 13.5788 16.8443 11.8791 16.8751 10.0984Z" fill="#2B2923" />
    </Svg>
  );
}

function WatchLevelIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path d="M19.3211 9.74688C19.2937 9.68516 18.632 8.21719 17.1609 6.74609C15.2008 4.78594 12.725 3.75 9.99999 3.75C7.27499 3.75 4.79921 4.78594 2.83905 6.74609C1.36796 8.21719 0.703118 9.6875 0.678899 9.74688C0.643362 9.82681 0.625 9.91331 0.625 10.0008C0.625 10.0883 0.643362 10.1748 0.678899 10.2547C0.706243 10.3164 1.36796 11.7836 2.83905 13.2547C4.79921 15.2141 7.27499 16.25 9.99999 16.25C12.725 16.25 15.2008 15.2141 17.1609 13.2547C18.632 11.7836 19.2937 10.3164 19.3211 10.2547C19.3566 10.1748 19.375 10.0883 19.375 10.0008C19.375 9.91331 19.3566 9.82681 19.3211 9.74688ZM9.99999 15C7.5953 15 5.49452 14.1258 3.75546 12.4023C3.0419 11.6927 2.43483 10.8836 1.95312 10C2.4347 9.11636 3.04179 8.30717 3.75546 7.59766C5.49452 5.87422 7.5953 5 9.99999 5C12.4047 5 14.5055 5.87422 16.2445 7.59766C16.9595 8.307 17.5679 9.11619 18.0508 10C17.4875 11.0516 15.0336 15 9.99999 15ZM9.99999 6.25C9.25831 6.25 8.53329 6.46993 7.9166 6.88199C7.29992 7.29404 6.81927 7.87971 6.53544 8.56494C6.25162 9.25016 6.17735 10.0042 6.32205 10.7316C6.46674 11.459 6.82389 12.1272 7.34834 12.6517C7.87279 13.1761 8.54097 13.5333 9.2684 13.6779C9.99583 13.8226 10.7498 13.7484 11.4351 13.4645C12.1203 13.1807 12.7059 12.7001 13.118 12.0834C13.5301 11.4667 13.75 10.7417 13.75 10C13.749 9.00576 13.3535 8.05253 12.6505 7.34949C11.9475 6.64645 10.9942 6.25103 9.99999 6.25ZM9.99999 12.5C9.50554 12.5 9.02219 12.3534 8.61107 12.0787C8.19994 11.804 7.87951 11.4135 7.69029 10.9567C7.50107 10.4999 7.45157 9.99723 7.54803 9.51227C7.64449 9.02732 7.88259 8.58186 8.23222 8.23223C8.58186 7.8826 9.02731 7.6445 9.51227 7.54804C9.99722 7.45157 10.4999 7.50108 10.9567 7.6903C11.4135 7.87952 11.804 8.19995 12.0787 8.61107C12.3534 9.0222 12.5 9.50555 12.5 10C12.5 10.663 12.2366 11.2989 11.7678 11.7678C11.2989 12.2366 10.663 12.5 9.99999 12.5Z" fill="#2B2923" />
    </Svg>
  );
}

function ChevronRightIcon({ color = "#2B2923" }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path d="M7.05781 4.19227C6.99974 4.1342 6.95368 4.06526 6.92225 3.98939C6.89082 3.91352 6.87465 3.8322 6.87465 3.75008C6.87465 3.66796 6.89082 3.58664 6.92225 3.51077C6.95368 3.4349 6.99974 3.36596 7.05781 3.30789C7.11588 3.24982 7.18482 3.20376 7.26069 3.17233C7.33656 3.14091 7.41787 3.12473 7.5 3.12473C7.58212 3.12473 7.66344 3.14091 7.73931 3.17233C7.81518 3.20376 7.88412 3.24982 7.94218 3.30789L14.1922 9.55789C14.2503 9.61594 14.2964 9.68487 14.3278 9.76074C14.3593 9.83662 14.3755 9.91795 14.3755 10.0001C14.3755 10.0822 14.3593 10.1635 14.3278 10.2394C14.2964 10.3153 14.2503 10.3842 14.1922 10.4423L7.94218 16.6923C7.82491 16.8095 7.66585 16.8754 7.5 16.8754C7.33414 16.8754 7.17508 16.8095 7.05781 16.6923C6.94053 16.575 6.87465 16.4159 6.87465 16.2501C6.87465 16.0842 6.94053 15.9252 7.05781 15.8079L12.8664 10.0001L7.05781 4.19227Z" fill={color} />
    </Svg>
  );
}

function IntegrationsIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path d="M19.6695 5.70306C19.5699 5.64964 19.4576 5.62426 19.3446 5.62963C19.2317 5.63499 19.1223 5.6709 19.0281 5.73353L16.25 7.58197V5.62494C16.25 5.29342 16.1183 4.97548 15.8839 4.74106C15.6495 4.50663 15.3315 4.37494 15 4.37494H2.5C2.16848 4.37494 1.85054 4.50663 1.61612 4.74106C1.3817 4.97548 1.25 5.29342 1.25 5.62494V14.3749C1.25 14.7065 1.3817 15.0244 1.61612 15.2588C1.85054 15.4932 2.16848 15.6249 2.5 15.6249H15C15.3315 15.6249 15.6495 15.4932 15.8839 15.2588C16.1183 15.0244 16.25 14.7065 16.25 14.3749V12.4218L19.0281 14.2742C19.1313 14.3412 19.252 14.3762 19.375 14.3749C19.5408 14.3749 19.6997 14.3091 19.8169 14.1919C19.9342 14.0747 20 13.9157 20 13.7499V6.24994C19.9992 6.13748 19.9681 6.02733 19.9099 5.93108C19.8518 5.83483 19.7687 5.75606 19.6695 5.70306ZM15 14.3749H2.5V5.62494H15V14.3749ZM18.75 12.582L16.25 10.9156V9.08431L18.75 7.42181V12.582Z" fill="#2B2923" />
    </Svg>
  );
}

function CalendarSyncIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path d="M16.25 2.5H14.375V1.875C14.375 1.70924 14.3092 1.55027 14.1919 1.43306C14.0747 1.31585 13.9158 1.25 13.75 1.25C13.5842 1.25 13.4253 1.31585 13.3081 1.43306C13.1908 1.55027 13.125 1.70924 13.125 1.875V2.5H6.875V1.875C6.875 1.70924 6.80915 1.55027 6.69194 1.43306C6.57473 1.31585 6.41576 1.25 6.25 1.25C6.08424 1.25 5.92527 1.31585 5.80806 1.43306C5.69085 1.55027 5.625 1.70924 5.625 1.875V2.5H3.75C3.41848 2.5 3.10054 2.6317 2.86612 2.86612C2.6317 3.10054 2.5 3.41848 2.5 3.75V16.25C2.5 16.5815 2.6317 16.8995 2.86612 17.1339C3.10054 17.3683 3.41848 17.5 3.75 17.5H16.25C16.5815 17.5 16.8995 17.3683 17.1339 17.1339C17.3683 16.8995 17.5 16.5815 17.5 16.25V3.75C17.5 3.41848 17.3683 3.10054 17.1339 2.86612C16.8995 2.6317 16.5815 2.5 16.25 2.5ZM5.625 3.75V4.375C5.625 4.54076 5.69085 4.69973 5.80806 4.81694C5.92527 4.93415 6.08424 5 6.25 5C6.41576 5 6.57473 4.93415 6.69194 4.81694C6.80915 4.69973 6.875 4.54076 6.875 4.375V3.75H13.125V4.375C13.125 4.54076 13.1908 4.69973 13.3081 4.81694C13.4253 4.93415 13.5842 5 13.75 5C13.9158 5 14.0747 4.93415 14.1919 4.81694C14.3092 4.69973 14.375 4.54076 14.375 4.375V3.75H16.25V6.25H3.75V3.75H5.625ZM16.25 16.25H3.75V7.5H16.25V16.25ZM10.9375 10.3125C10.9375 10.4979 10.8825 10.6792 10.7795 10.8333C10.6765 10.9875 10.5301 11.1077 10.3588 11.1786C10.1875 11.2496 9.99896 11.2682 9.8171 11.232C9.63525 11.1958 9.4682 11.1065 9.33709 10.9754C9.20598 10.8443 9.11669 10.6773 9.08051 10.4954C9.04434 10.3135 9.06291 10.125 9.13386 9.95373C9.20482 9.78243 9.32498 9.63601 9.47915 9.533C9.63332 9.42998 9.81458 9.375 10 9.375C10.2486 9.375 10.4871 9.47377 10.6629 9.64959C10.8387 9.8254 10.9375 10.0639 10.9375 10.3125ZM14.375 10.3125C14.375 10.4979 14.32 10.6792 14.217 10.8333C14.114 10.9875 13.9676 11.1077 13.7963 11.1786C13.625 11.2496 13.4365 11.2682 13.2546 11.232C13.0727 11.1958 12.9057 11.1065 12.7746 10.9754C12.6435 10.8443 12.5542 10.6773 12.518 10.4954C12.4818 10.3135 12.5004 10.125 12.5714 9.95373C12.6423 9.78243 12.7625 9.63601 12.9167 9.533C13.0708 9.42998 13.2521 9.375 13.4375 9.375C13.6861 9.375 13.9246 9.47377 14.1004 9.64959C14.2762 9.8254 14.375 10.0639 14.375 10.3125ZM7.5 13.4375C7.5 13.6229 7.44502 13.8042 7.342 13.9583C7.23899 14.1125 7.09257 14.2327 6.92127 14.3036C6.74996 14.3746 6.56146 14.3932 6.3796 14.357C6.19775 14.3208 6.0307 14.2315 5.89959 14.1004C5.76848 13.9693 5.67919 13.8023 5.64301 13.6204C5.60684 13.4385 5.62541 13.25 5.69636 13.0787C5.76732 12.9074 5.88748 12.761 6.04165 12.658C6.19582 12.555 6.37708 12.5 6.5625 12.5C6.81114 12.5 7.0496 12.5988 7.22541 12.7746C7.40123 12.9504 7.5 13.1889 7.5 13.4375ZM10.9375 13.4375C10.9375 13.6229 10.8825 13.8042 10.7795 13.9583C10.6765 14.1125 10.5301 14.2327 10.3588 14.3036C10.1875 14.3746 9.99896 14.3932 9.8171 14.357C9.63525 14.3208 9.4682 14.2315 9.33709 14.1004C9.20598 13.9693 9.11669 13.8023 9.08051 13.6204C9.04434 13.4385 9.06291 13.25 9.13386 13.0787C9.20482 12.9074 9.32498 12.761 9.47915 12.658C9.63332 12.555 9.81458 12.5 10 12.5C10.2486 12.5 10.4871 12.5988 10.6629 12.7746C10.8387 12.9504 10.9375 13.1889 10.9375 13.4375ZM14.375 13.4375C14.375 13.6229 14.32 13.8042 14.217 13.9583C14.114 14.1125 13.9676 14.2327 13.7963 14.3036C13.625 14.3746 13.4365 14.3932 13.2546 14.357C13.0727 14.3208 12.9057 14.2315 12.7746 14.1004C12.6435 13.9693 12.5542 13.8023 12.518 13.6204C12.4818 13.4385 12.5004 13.25 12.5714 13.0787C12.6423 12.9074 12.7625 12.761 12.9167 12.658C13.0708 12.555 13.2521 12.5 13.4375 12.5C13.6861 12.5 13.9246 12.5988 14.1004 12.7746C14.2762 12.9504 14.375 13.1889 14.375 13.4375Z" fill="#2B2923" />
    </Svg>
  );
}

function DataPrivacyIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path d="M10 8.75C9.47469 8.75018 8.96698 8.93939 8.56967 9.28305C8.17237 9.62671 7.912 10.1019 7.83616 10.6217C7.76031 11.1415 7.87406 11.6712 8.15661 12.1141C8.43916 12.5569 8.87164 12.8833 9.375 13.0336V14.375C9.375 14.5408 9.44085 14.6997 9.55806 14.8169C9.67527 14.9342 9.83424 15 10 15C10.1658 15 10.3247 14.9342 10.4419 14.8169C10.5592 14.6997 10.625 14.5408 10.625 14.375V13.0336C11.1284 12.8833 11.5608 12.5569 11.8434 12.1141C12.1259 11.6712 12.2397 11.1415 12.1638 10.6217C12.088 10.1019 11.8276 9.62671 11.4303 9.28305C11.033 8.93939 10.5253 8.75018 10 8.75ZM10 11.875C9.81458 11.875 9.63332 11.82 9.47915 11.717C9.32498 11.614 9.20482 11.4676 9.13386 11.2963C9.06291 11.125 9.04434 10.9365 9.08051 10.7546C9.11669 10.5727 9.20598 10.4057 9.33709 10.2746C9.4682 10.1435 9.63525 10.0542 9.8171 10.018C9.99896 9.98184 10.1875 10.0004 10.3588 10.0714C10.5301 10.1423 10.6765 10.2625 10.7795 10.4167C10.8825 10.5708 10.9375 10.7521 10.9375 10.9375C10.9375 11.1861 10.8387 11.4246 10.6629 11.6004C10.4871 11.7762 10.2486 11.875 10 11.875ZM16.25 6.25H13.75V4.375C13.75 3.38044 13.3549 2.42661 12.6517 1.72335C11.9484 1.02009 10.9946 0.625 10 0.625C9.00544 0.625 8.05161 1.02009 7.34835 1.72335C6.64509 2.42661 6.25 3.38044 6.25 4.375V6.25H3.75C3.41848 6.25 3.10054 6.3817 2.86612 6.61612C2.6317 6.85054 2.5 7.16848 2.5 7.5V16.25C2.5 16.5815 2.6317 16.8995 2.86612 17.1339C3.10054 17.3683 3.41848 17.5 3.75 17.5H16.25C16.5815 17.5 16.8995 17.3683 17.1339 17.1339C17.3683 16.8995 17.5 16.5815 17.5 16.25V7.5C17.5 7.16848 17.3683 6.85054 17.1339 6.61612C16.8995 6.3817 16.5815 6.25 16.25 6.25ZM7.5 4.375C7.5 3.71196 7.76339 3.07607 8.23223 2.60723C8.70107 2.13839 9.33696 1.875 10 1.875C10.663 1.875 11.2989 2.13839 11.7678 2.60723C12.2366 3.07607 12.5 3.71196 12.5 4.375V6.25H7.5V4.375ZM16.25 16.25H3.75V7.5H16.25V16.25Z" fill="#2B2923" />
    </Svg>
  );
}

type TabId = "account" | "barn";

// Behaviors shown under the slider per level
const LEVEL_BEHAVIORS: Record<number, string[]> = {
  5: ["Rolling"],
  4: ["Rolling", "Biting"],
  3: ["Rolling", "Biting", "Repeated lying/standing", "Lying down for a long time"],
  2: ["Rolling", "Biting", "Repeated lying/standing"],
  1: ["Rolling", "Biting", "Repeated lying/standing"],
};

// ── Watch level slider ────────────────────────────────────────────────────────

function WatchLevelSlider({
  level,
  onChange,
}: {
  level: number;
  onChange: (l: number) => void;
}) {
  const [containerWidth, setContainerWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  // Dot centers are evenly distributed across the inner track
  const dotIndex = level - 3; // 0–2
  const dotCenter =
    containerWidth > 0
      ? (dotIndex / 2) * containerWidth
      : 0;

  const highlightW = 80;
  const highlightLeft = dotCenter - highlightW / 2;

  return (
    <View>
      <View style={styles.sliderContainer} onLayout={onLayout}>
        {/* Background highlight pill behind selected dot */}
        {containerWidth > 0 && (
          <View
            style={[
              styles.sliderHighlight,
              { left: Math.max(0, Math.min(highlightLeft, containerWidth - highlightW)) },
            ]}
          />
        )}
        {/* Dots */}
        <View style={styles.sliderTrack}>
          {[3, 4, 5].map((l) => (
            <TouchableOpacity
              key={l}
              onPress={() => onChange(l)}
              activeOpacity={0.7}
              style={styles.dotWrap}
            >
              <View
                style={[
                  styles.dot,
                  l === level && styles.dotSelected,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Labels */}
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabel}>LOW SENSITIVITY</Text>
        <Text style={styles.sliderLabel}>HIGH SENSITIVITY</Text>
      </View>

    </View>
  );
}

// ── Notification row ─────────────────────────────────────────────────────────

function NotifRow({
  icon,
  title,
  description,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.notifRow}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.notifRowContent}>
        <View style={styles.notifRowHeader}>
          {icon}
          <Text style={styles.notifRowTitle}>{title}</Text>
        </View>
        <Text style={styles.notifRowDesc}>{description}</Text>
      </View>
      {onPress && <ChevronRightIcon />}
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { settings, updateSettings } = useApp();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("account");
  const [loggingOut, setLoggingOut] = useState(false);

  // Barn settings edit state
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    farmName: settings.farmName,
    ownerName: settings.ownerName,
    email: settings.email,
    phone: settings.phone,
    vetPhone: settings.vetPhone,
  });

  const handleWatchLevel = useCallback(
    (level: number) => {
      updateSettings({ paranoiaLevel: level });
    },
    [updateSettings]
  );

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          try { await logout(); } finally { setLoggingOut(false); }
        },
      },
    ]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(draft);
      setIsEditing(false);
    } catch {
      Alert.alert("Error", "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const initials = (settings.ownerName || user?.name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const tabs = [
    { id: "account" as TabId, label: "My Account" },
    { id: "barn" as TabId, label: "Barn Settings" },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header + tab pill */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.tabPillContainer}>
          {tabs.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabPill, selected && styles.tabPillSelected]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabPillText, selected && styles.tabPillTextSelected]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {activeTab === "account" && (
          <View style={styles.section}>
            {/* Profile card */}
            <View style={styles.profileCard}>
              {/* Avatar + info */}
              <View style={styles.profileRow}>
                <Image
                  source={require("../../assets/images/profile-avatar.png")}
                  style={styles.avatar}
                />
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>
                    {settings.ownerName || user?.name || "Your Name"}
                  </Text>
                  {settings.phone ? (
                    <View style={styles.infoRow}>
                      <Feather name="phone" size={16} color="#939189" />
                      <Text style={styles.infoText}>{settings.phone}</Text>
                    </View>
                  ) : null}
                  {(settings.email || user?.email) ? (
                    <View style={styles.infoRow}>
                      <Feather name="mail" size={16} color="#939189" />
                      <Text style={styles.infoText}>{settings.email || user?.email}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Edit Profile button */}
              <TouchableOpacity
                style={styles.editProfileBtn}
                onPress={() => { setActiveTab("barn"); setIsEditing(true); }}
                activeOpacity={0.8}
              >
                <Text style={styles.editProfileBtnText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>

            {/* Notifications */}
            <View style={styles.notifSection}>
              <Text style={styles.notifTitle}>Notifications</Text>

              <View style={styles.notifList}>
                <NotifRow
                  icon={<MoonIcon />}
                  title="Quiet hours"
                  description={
                    <Text style={styles.notifRowDesc}>
                      {"Automatically mute low-priority notifications during your set hours. "}
                      <Text style={styles.notifRowDescBold}>
                        Warning and Critical alerts will still go through.
                      </Text>
                    </Text>
                  }
                  onPress={() => {}}
                />

                <View style={styles.notifDivider} />

                <NotifRow
                  icon={<PerHorseIcon />}
                  title="Per-horse"
                  description="Focused on a specific horse? Choose which ones to get notified about."
                  onPress={() => {}}
                />

                <View style={styles.notifDivider} />

                {/* Watch level */}
                <View style={styles.notifRow}>
                  <View style={styles.notifRowContent}>
                    <View style={styles.notifRowHeader}>
                      <WatchLevelIcon />
                      <Text style={styles.notifRowTitle}>Watch level</Text>
                    </View>
                    <Text style={styles.notifRowDesc}>
                      Controls how sensitive Valkyrie is to unusual behavior. The higher the level, the more easily alerts will be triggered.
                    </Text>
                    <View style={{ marginTop: 18 }}>
                      <WatchLevelSlider
                        level={Math.max(3, settings.paranoiaLevel ?? 3)}
                        onChange={handleWatchLevel}
                      />
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Sign out */}
            <TouchableOpacity
              style={styles.signOutBtn}
              onPress={handleLogout}
              disabled={loggingOut}
              activeOpacity={0.8}
            >
              {loggingOut ? (
                <ActivityIndicator size="small" color={Colors.critical.text} />
              ) : (
                <>
                  <Feather name="log-out" size={16} color={Colors.critical.text} />
                  <Text style={styles.signOutText}>Sign Out</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {activeTab === "barn" && (
          <BarnSettingsTab />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Barn Settings Tab ─────────────────────────────────────────────────────────

function BarnSettingsTab() {
  const [calendarSync, setCalendarSync] = useState(true);

  const CONTACTS = [
    { name: "Kathy M.", phone: "(310) XXX - XXXX" },
    { name: "Justin J.", phone: "(310) XXX - XXXX" },
    { name: "Trent K.", phone: "(310) XXX - XXXX" },
  ];

  return (
    <View style={barnStyles.page}>
      {/* Barn name + location */}
      <View style={barnStyles.barnHeader}>
        <Text style={barnStyles.barnName}>Sunset Equine Farms</Text>
        <View style={barnStyles.infoRow}>
          <Feather name="map-pin" size={16} color="#939189" />
          <Text style={barnStyles.infoText}>Burbank, CA</Text>
        </View>
      </View>

      {/* Emergency contacts */}
      <View style={barnStyles.section}>
        <Text style={barnStyles.sectionTitle}>Emergency contacts</Text>

        <Text style={barnStyles.subLabel}>VET ON FILE</Text>

        {/* Vet card */}
        <TouchableOpacity style={barnStyles.vetCard} activeOpacity={0.85}>
          <View style={barnStyles.vetCardContent}>
            <Text style={barnStyles.vetName}>Dr. Jun</Text>
            <View style={barnStyles.vetDetails}>
              <View style={barnStyles.infoRow}>
                <Feather name="phone" size={16} color="#fbf9f0" />
                <Text style={barnStyles.vetInfoText}>(310) XXX - XXXX</Text>
              </View>
              <View style={barnStyles.infoRow}>
                <Feather name="mail" size={16} color="#fbf9f0" />
                <Text style={barnStyles.vetInfoText}>jun@horseclinic.com</Text>
              </View>
            </View>
          </View>
          <ChevronRightIcon color="#fbf9f0" />
        </TouchableOpacity>

        {/* Other contacts */}
        {CONTACTS.map((c) => (
          <View key={c.name} style={barnStyles.contactRow}>
            <Text style={barnStyles.contactName}>{c.name}</Text>
            <View style={barnStyles.infoRow}>
              <Feather name="phone" size={16} color="#939189" />
              <Text style={barnStyles.contactPhone}>{c.phone}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Integrations */}
      <View style={barnStyles.section}>
        <TouchableOpacity style={barnStyles.sectionTitleRow} activeOpacity={0.7}>
          <View style={barnStyles.sectionTitleLeft}>
            <IntegrationsIcon />
            <Text style={barnStyles.sectionTitle}>Integrations</Text>
          </View>
          <ChevronRightIcon color={Colors.textTertiary} />
        </TouchableOpacity>
        <View style={barnStyles.listRow}>
          <Text style={barnStyles.listRowLabel}>Camera connection status</Text>
          <View style={barnStyles.statusRow}>
            <View style={barnStyles.greenDot} />
            <Text style={barnStyles.listRowValue}>All Online</Text>
          </View>
        </View>
      </View>

      {/* Calendar sync */}
      <View style={barnStyles.section}>
        <View style={barnStyles.sectionTitleLeft}>
          <CalendarSyncIcon />
          <Text style={barnStyles.sectionTitle}>Calendar sync</Text>
        </View>
        <View style={barnStyles.calendarRow}>
          <Text style={barnStyles.calendarDesc}>
            Sync with your default calendar for vet visits, appointments, etc.
          </Text>
          <Switch
            value={calendarSync}
            onValueChange={setCalendarSync}
            trackColor={{ false: "#ccc", true: GOLD }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Data and Privacy */}
      <View style={barnStyles.section}>
        <View style={barnStyles.sectionTitleLeft}>
          <DataPrivacyIcon />
          <Text style={barnStyles.sectionTitle}>Data and Privacy</Text>
        </View>
        <TouchableOpacity style={barnStyles.listRow} activeOpacity={0.7}>
          <Text style={barnStyles.listRowLabel}>Export alert history</Text>
          <Feather name="share" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={barnStyles.listRow} activeOpacity={0.7}>
          <Text style={barnStyles.listRowLabel}>Data retention settings</Text>
          <ChevronRightIcon color={Colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Delete Account */}
      <TouchableOpacity style={barnStyles.deleteBtn} activeOpacity={0.8}>
        <Text style={barnStyles.deleteBtnText}>Delete Account</Text>
      </TouchableOpacity>
    </View>
  );
}

function BarnRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.barnRow}>
      <Text style={styles.barnRowLabel}>{label}</Text>
      <Text style={styles.barnRowValue}>{value || "—"}</Text>
    </View>
  );
}

function BarnField({
  label, value, onChangeText, keyboard = "default",
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboard?: "default" | "email-address" | "phone-pad";
}) {
  return (
    <View style={styles.barnRow}>
      <Text style={styles.barnRowLabel}>{label}</Text>
      <TextInput
        style={styles.barnFieldInput}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboard}
        placeholderTextColor={Colors.textTertiary}
        textAlign="right"
      />
    </View>
  );
}

const CREAM = "#fbf9f0";
const WARM_GRAY = "#efede4";
const GOLD = "#bda632";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    gap: 12,
  },
  title: { ...type.header, color: Colors.textPrimary },
  tabPillContainer: {
    flexDirection: "row",
    backgroundColor: WARM_GRAY,
    borderRadius: 999,
    padding: 3,
    height: 35,
  },
  tabPill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  tabPillSelected: { backgroundColor: CREAM },
  tabPillText: { ...type.caption1, color: Colors.textTertiary },
  tabPillTextSelected: { ...type.caption1, color: Colors.textPrimary },

  scroll: { paddingHorizontal: 16 },
  section: { gap: 32, paddingTop: 8 },

  // Profile card
  profileCard: { gap: 24 },
  profileRow: { flexDirection: "row", gap: 32, alignItems: "center" },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: WARM_GRAY,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: { ...type.title1, color: Colors.textPrimary },
  profileInfo: { flex: 1, gap: 8 },
  profileName: { ...type.title3, fontWeight: "500", color: Colors.textPrimary },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { ...type.callout, color: "#939189" },
  editProfileBtn: {
    height: 48,
    borderRadius: 47,
    borderWidth: 1,
    borderColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
  },
  editProfileBtnText: { ...type.callout, fontWeight: "500", color: GOLD },

  // Notifications
  notifSection: { gap: 12 },
  notifTitle: { ...type.title3, fontWeight: "500", color: Colors.textPrimary },
  notifList: { gap: 0 },
  notifDivider: { height: 1, backgroundColor: WARM_GRAY },
  notifRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 18,
    gap: 8,
  },
  notifRowContent: { flex: 1, gap: 8 },
  notifRowHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  notifRowTitle: { ...type.callout, fontWeight: "500", color: Colors.textPrimary },
  notifRowDesc: { ...type.caption1, color: Colors.textPrimary, lineHeight: 17 },
  notifRowDescBold: { ...type.caption1, fontWeight: "600", color: Colors.textPrimary },

  // Watch level slider
  sliderContainer: {
    height: 48,
    borderWidth: 1,
    borderColor: WARM_GRAY,
    borderRadius: 88,
    paddingHorizontal: 16,
    justifyContent: "center",
    overflow: "hidden",
  },
  sliderHighlight: {
    position: "absolute",
    top: "50%",
    marginTop: -16,
    width: 80,
    height: 32,
    backgroundColor: WARM_GRAY,
    borderRadius: 88,
  },
  sliderTrack: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dotWrap: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#c8c4bb",
  },
  dotSelected: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: GOLD,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  sliderLabel: { ...type.caption1, color: Colors.textTertiary },
  behaviorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
  },
  behaviorTag: {
    backgroundColor: WARM_GRAY,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  behaviorTagText: { ...type.caption1, color: Colors.textPrimary },

  // Sign out
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 44,
    borderRadius: 8,
    backgroundColor: Colors.critical.bg,
  },
  signOutText: { ...type.callout, fontWeight: "600", color: Colors.critical.text },

  // Barn settings
  barnCard: {
    backgroundColor: WARM_GRAY,
    borderRadius: 12,
    padding: 18,
    gap: 16,
  },
  barnCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  barnCardTitle: { ...type.caption1Medium, color: Colors.textTertiary, letterSpacing: 0.5 },
  barnFields: { gap: 12 },
  barnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  barnRowLabel: { ...type.callout, color: Colors.textTertiary },
  barnRowValue: { ...type.callout, fontWeight: "500", color: Colors.textPrimary },
  barnFieldInput: {
    ...type.callout,
    fontWeight: "500",
    color: Colors.textPrimary,
    minWidth: 160,
    textAlign: "right",
  },
  editActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 8,
  },
  cancelBtnText: { ...type.callout, fontWeight: "600", color: Colors.textPrimary },
  saveBtn: {
    flex: 1,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: GOLD,
    borderRadius: 8,
  },
  saveBtnText: { ...type.callout, fontWeight: "600", color: "#fff" },
});

const barnStyles = StyleSheet.create({
  page: { gap: 32, paddingTop: 8, paddingBottom: 40 },

  barnHeader: { gap: 8 },
  barnName: { ...type.title3, fontWeight: "500", color: Colors.textPrimary },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { ...type.callout, color: "#939189" },

  section: { gap: 12 },
  sectionTitle: { ...type.title3, fontWeight: "500", color: Colors.textPrimary },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitleLeft: { flexDirection: "row", alignItems: "center", gap: 8 },

  subLabel: { ...type.caption1Medium, color: Colors.textTertiary, letterSpacing: 0.5 },

  vetCard: {
    backgroundColor: GOLD,
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  vetCardContent: { flex: 1, gap: 8 },
  vetName: { ...type.title3, fontWeight: "500", color: CREAM },
  vetDetails: { gap: 8 },
  vetInfoText: { ...type.callout, color: CREAM },

  contactRow: { gap: 8 },
  contactName: { ...type.callout, fontWeight: "500", color: Colors.textPrimary },
  contactPhone: { ...type.callout, color: "#939189" },

  listRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  listRowLabel: { ...type.callout, color: Colors.textPrimary },
  listRowValue: { ...type.callout, color: Colors.textPrimary },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#22c55e",
  },

  calendarRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },
  calendarDesc: { ...type.caption1, color: Colors.textPrimary, flex: 1, lineHeight: 17 },

  deleteBtn: {
    height: 48,
    borderRadius: 47,
    borderWidth: 1,
    borderColor: "#e24d17",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtnText: { ...type.callout, fontWeight: "500", color: "#e24d17" },
});
