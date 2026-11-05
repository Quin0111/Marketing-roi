# PHASE 4B.3 — Kiến trúc và kế hoạch nghiên cứu đề nghị

Ngày: **03/11/2026**. Trạng thái: **đề xuất, chưa thực thi**. Không chạy training/optimizer, không sửa website/backend/model hiện tại; giữ **BASELINE_ONLY**. [Báo cáo khả thi](dataset_feasibility_report.md) và [so sánh dữ liệu](dataset_comparison.md) là căn cứ chọn hướng.

## 1. Phương án phù hợp nhất

Không tiếp tục tìm learner phức tạp trên CSV cũ. Tách hai đích nghiên cứu:

1. **Đồ án phương pháp có phạm vi rõ:** ưu tiên thẩm định Criteo corrected release cho incremental conversion của treatment so với control; hoặc Hillstrom cho lựa chọn email khi quyền sử dụng rõ. Đổi tên bài toán thành uplift/response hoặc incremental revenue đúng với dữ liệu. Không gọi kết quả này là tối ưu ROI đa kênh của DreamMakers và không thay website hiện tại.
2. **Đích triển khai DreamMakers:** thu thập first-party data có snapshot trước phân bổ, hành động/eligibility/propensity, chi phí và outcome kinh tế. Bắt đầu một quyết định nhỏ có đối chứng, ví dụ một email/offer so với không gửi trong một population; chỉ mở rộng kênh khi dữ liệu và thiết kế cho phép. Một benchmark public không thay pilot trong thị trường đích.

Uplift nghiên cứu tác động tăng thêm, khác outcome prediction, theo [Gutierrez & Gérardy](https://proceedings.mlr.press/v67/gutierrez17a.html). Lựa chọn nguồn dữ liệu ở đây là khuyến nghị nghiên cứu; chưa có nguồn nào được chấp thuận ingestion/training trong Phase này.

## 2. Tổ chức nhánh thực nghiệm tương lai

Mỗi nguồn có namespace riêng theo mẫu đề xuất `research/new_data/<source>/<release>/<experiment_id>/`, gồm source/rights manifest, immutable raw hash, dictionary, cutoff rules, split membership, preregistration, environment, all trials, OOF predictions và evaluation. **Chưa tạo hoặc tải dữ liệu vào cấu trúc này.** “Nhánh” ở đây là thư mục nghiên cứu riêng; không khởi tạo Git/branch/commit/push.

DM-DEV-170K-v1 chỉ tiếp tục dùng cho hồ sơ cũ; không áp fold IDs, baseline, target distribution hoặc ngưỡng RMSE 1,734476 cho dữ liệu khác. Không concatenate các nguồn khác khách hàng/market/action/horizon. Muốn pooling phải chứng minh cùng estimand, units, sampling, rights và entity linkage; nếu không, báo các benchmark riêng, không tính một ROI trung bình chung.

Trước ingestion phải kiểm tra đúng file/version, checksum, redistribution rights, publisher notices, schema/row count/duplicates/units, timeline, experimental design, sampling và các thay đổi release. License code không tự cấp quyền raw data. Với Criteo kiểm tra bản corrected và nonuniform sampling; với Hillstrom quyền chưa rõ là blocker. Đây là gate kỹ thuật và quyền sử dụng, không phải tối ưu để chọn nguồn có score đẹp.

## 3. Data contract first-party cần thu thập

Đơn vị phân tích phải khóa rõ: customer-decision, campaign hoặc geo-week. Khóa chống trùng và group IDs dùng để chia tập, không mặc nhiên làm predictor.

| Nhóm bảng | Trường tối thiểu đề nghị | Thời điểm/kiểm toán |
|---|---|---|
| Decision/context | decision_id, customer/household/campaign/geo ID đã bảo vệ, prediction_time, event_time, available_at, eligibility, consent, timezone | Snapshot context hoàn tất trước assignment; không suy lại từ responders |
| Kế hoạch/action | action_id/version, channel, campaign objective/type, planned start/end, budget, bid, offer/creative/product, target rule | Lưu cả action được cân nhắc và action khả thi, including no-action; không chỉ action thắng |
| Assignment | experiment_id, randomization unit/stratum, assigned_action, exact assignment probabilities, assignment_time, logging-policy version | Probabilities theo thiết kế; phân biệt eligible, assigned, delivered và exposed |
| Delivery/compliance | sent/exposed, actual dates, actual spend, caps và failure reason | Sau action; phục vụ ITT/compliance audit, không nhét vào pre-treatment context |
| Outcomes | conversions, gross/net revenue, currency, refunds, contribution margin, fulfillment/offer/marketing cost, outcome_time/window | Đối soát order/payment/ad ledger; mọi arm kể cả control được theo dõi cùng quy tắc |
| Lịch sử/context ngoài | Lagged purchases, lags hiệu quả đã mature, inventory, planned price, season/event calendar thật | `available_at <= prediction_time`; không dùng outcome đến trễ trong lag |
| Lineage | Source/version, entity joins, FX/tax/window rules, backfill và attribution version | Lưu bản ghi có thể replay as-of, dictionary và approvals về quyền dữ liệu |

Không cần PII thô để làm đồ án. Với multi-channel cần xử lý giao thoa, khách hàng chung household, cannibalization và chi phí cùng phát sinh; randomization unit phải tương ứng. Các field là **đề nghị thu thập**, không khẳng định đang tồn tại hoặc tự thêm chúng vào website.

## 4. Biến mục tiêu và bài toán dự đoán

Giữ ROI cũ nguyên byte và hiển thị theo phạm vi nghiên cứu hiện tại. **Nhánh mới nên dùng outcome có thể kiểm toán trước khi chọn tỷ số:** conversion cho Criteo/UCI, two-week customer revenue cho Hillstrom, hoặc net revenue/contribution cho first-party. Khả năng causal chỉ có khi thiết kế/giả định nhận diện phù hợp, không đi kèm tự động với tên target.

Với first-party ưu tiên dự đoán thành phần outcome/cost và đánh giá **incremental net profit so với no-action/current policy**. ROAS attributed có thể dùng cho reporting nhưng không thay causal utility. Các định nghĩa và xử lý mẫu số 0/âm ở [báo cáo khả thi](dataset_feasibility_report.md). Không lấy ROI cũ để dựng revenue giả hoặc coi balance/history là revenue mới.

Khởi đầu một số ít baseline được đăng ký trước: unconditional/segment baseline, response baseline có action khi hợp lệ, một mô hình regularized đơn giản. Metric theo target: log loss/Brier/calibration/PR-AUC cho conversion; MAE/RMSE và sai số theo nhóm cho outcome tiền. Mọi imputer/encoder/selection/calibration học trong tập phù hợp; thử nghiệm phải lưu toàn bộ cấu hình kể cả không cải thiện. Đây là thiết kế tương lai, **không có mô hình mới được fit trong Phase 4B.3**.

Prediction score chỉ kiểm tra dự báo; không dùng PR-AUC hoặc RMSE để suy rằng chọn action làm lợi nhuận tăng. Một outcome baseline dự đoán tốt người vốn sẽ mua vẫn có thể chọn treatment sai.

## 5. Đánh giá trên dữ liệu độc lập

Chốt protocol mới trước khi nhìn outcomes của holdout. Giữ bốn vai trò dữ liệu riêng: fit/tuning, policy selection, calibration nếu cần, final evaluation. Có thể dùng nested evaluation/cross-fitting trong Development mới, nhưng final evaluation phải nằm ngoài toàn bộ selection. Không áp tỷ lệ chia cứng khi chưa kiểm tra số events/control và power.

- **User randomized benchmark:** giữ khách hàng/household trong cùng partition; stratify assignment phù hợp, giữ nguyên cơ chế sampling. Nếu không có ID/timestamp để kiểm tra dependence, ghi hạn chế và không gọi random holdout là external validation. Kiểm tra balance và outcome attrition nhưng không tùy ý lọc treatment theo response.
- **First-party campaign/geo/time:** tách theo đơn vị randomization, khách hàng/campaign chung và thời gian; outer validation rolling/group theo quyết định triển khai. Gap phải bao phủ outcome maturation, attribution lag và carryover phù hợp. Không random-split events của một người qua train/test.
- **New final holdout:** time/market/entity độc lập với lịch sử đã dùng; lock membership/hash và giới hạn mở sau khi policy cố định. Thất bại phải ghi fail; không sửa rồi chấm lại cùng final holdout như độc lập.
- **Test 30.000 cũ:** tiếp tục khóa; không dùng để chọn nguồn, target, feature, model, scenario hoặc quyết định có nghiên cứu tiếp. Hồ sơ EDA cũ chưa chứng minh blinded hoàn toàn; nghiệm thu kinh doanh cần dữ liệu mới.

Power tính theo minimal economically meaningful effect, baseline conversion/outcome variance, allocation ratios, số action, clustering, attrition và multiple comparisons. Nhiều user rows không thay nhiều campaign/geo độc lập. Chưa có đủ thông số để đưa ra n hoặc thời lượng pilot cụ thể.

## 6. Bộ máy kịch bản khả thi — kiến trúc đề nghị

Luồng logic, **chưa code/triển khai**:

`as-of context → eligibility/constraint checks → supported candidate actions → outcome/effect + cost + uncertainty → policy comparison → abstain/review → controlled pilot → evidence gate`

Tách context không được tùy ý đổi (khách hàng, lịch sử, tồn kho đã biết) khỏi action có thể can thiệp (gửi loại email, channel/budget/offer đã được cấp quyền). Candidate generator chỉ lấy action thuộc hợp đồng, trong support, đúng channel×type compatibility, budget/caps, min/max duration, inventory, consent và tần suất liên hệ. Có `no_action` và `current_policy` để so sánh, không thêm phương án không thể triển khai.

Không enumerate mọi tổ hợp trong dropdown rồi gọi argmax là tối ưu. Với budget liên tục, thiếu dose-response và overlap thì không nội suy/ngoại suy vô hạn; dừng ở mức chi đã được nghiên cứu. Forecast impressions/reach nếu cần phải có mô hình riêng và truyền uncertainty, không dùng future actual thay planned inputs. Chưa có constraints catalog hoặc dose-response hợp lệ trong CSV cũ.

## 7. Kiểm chứng lựa chọn và xếp hạng phương án

Định nghĩa policy cố định `pi(x)` và utility `U`, so với no-action và incumbent policy. Đích là `V(pi)-V(pi0)`, không phải max của điểm dự đoán hoặc tương quan giữa score và ROI quan sát.

Với randomized logs và xác suất assignment hợp lệ, có thể đánh giá heldout policy bằng IPS hoặc doubly robust, cross-fit nuisance models và tách policy selection. [Dudík, Langford & Li](https://arxiv.org/abs/1103.4601) là nguồn phương pháp. Công thức DR đề nghị cho action rời rạc:

```text
V_DR(pi) = mean_i [ sum_a pi(a|x_i) * mu_hat(x_i,a)
                  + pi(a_i|x_i)/e(a_i|x_i) * (u_i-mu_hat(x_i,a_i)) ]
```

`mu_hat` ước lượng utility có điều kiện; `e` là assignment propensity đúng cho quần thể phân tích. Cần consistency, overlap và unconfoundedness/thiết kế random phù hợp; sampling, attrition và interference phải được xử lý. Doubly robust không sửa hidden confounding hoặc support bằng 0. Tỷ lệ treatment toàn file không tự là `e(a|x)` cho mọi user; không sinh propensity giả.

Kiểm tra thêm: weight distribution, effective sample size theo action/subgroup, trimming rule khóa trước và sensitivity, policy value CI theo đơn vị randomization, cost-aware uplift curves/Qini/AUUC nếu đúng task. Các ranking metric chỉ bổ trợ, không thay net-profit value. Chỉ một counterfactual được quan sát cho mỗi user; không thể kiểm chứng “thứ tự đúng của mọi action cho từng người” bằng nhãn thực tế đơn lẻ. Regret với oracle chỉ báo trong simulation có DGP/counterfactual rõ.

Nếu observational không có identification/overlap đủ, không dùng OPE làm chứng minh triển khai. Thiết kế RCT policy-level: random unit vào policy đề nghị và incumbent, đo ITT utility trên cùng horizon/ledger; khóa MDE, allocation, duration, maturity, stopping, multiplicity và guardrails trước chạy. Nhiều kênh có spillover cần cluster/geo design phù hợp. Không tái dùng experiment vừa tune policy để tuyên bố xác nhận độc lập.

## 8. Bất định, rủi ro và quyền từ chối

Phân biệt ba đại lượng: prediction interval của outcome cá thể, CI của treatment/policy effect, uncertainty do shift/model assumptions. Coverage tốt của outcome interval không chứng minh effect estimate đúng. Bootstrap/resampling theo customer/household/geo randomization unit; không lấy 15 fold cũ làm 15 mẫu độc lập.

Calibration set tách fit/selection; kiểm tra coverage/width theo nhóm và thời gian, probability calibration cho conversion. Báo CI của incremental utility, downside risk, expected spend, overlap và tính nhạy với giá/margin/cost. Propagate cost và response uncertainty qua scenario; không dùng cùng một sai số RMSE cộng/trừ như interval cho mọi người.

Abstain khi thiếu field, category/action ngoài support, budget không được nghiên cứu, uncertainty lớn hơn chênh utility, thiếu cost/propensity, constraint conflict hoặc shift ngoài miền đã kiểm tra. Khi tie hoặc cận lợi ích không đủ, giữ incumbent/no-action theo quy tắc khóa trước thay vì ép chọn “tốt nhất”.

Nếu sau này theo MMM: cần geo/time spend, controls và summable outcomes, lịch sử đủ dài. [Meridian collection guidance](https://developers.google.com/meridian/docs/pre-modeling/collect-data) đưa rule of thumb ≥2 năm weekly geo-level hoặc ≥3 năm national; đây không là bảo đảm nhận diện/power. Phải kiểm tra confounding, carryover/saturation, thời gian, calibration experiments và sensitivity. MMM chỉ là hướng có điều kiện khi dữ liệu đạt yêu cầu, không phải bước tiếp theo mặc định.

## 9. Điều kiện cụ thể trước khi mở khuyến nghị

Các gate sau là **đề xuất để preregister trước nghiên cứu mới**, chưa là thay đổi metadata hoặc chuẩn đã được kiểm chứng. Chưa đủ business inputs để chốt số tiền MDE, ESS hay mức rủi ro; khi chưa chốt, gate chưa đạt. Không giảm ngưỡng sau khi thấy scores.

| Gate | Điều kiện nghiệm thu đề nghị | Bằng chứng bắt buộc / hiện trạng |
|---|---|---|
| G0 Rights/provenance | Quyền dùng đúng mục đích/file/version rõ; 100% field có dictionary, source và timing | License/notices, hash và source lineage; **chưa đạt với dữ liệu gốc** |
| G1 Outcome | Currency, gross/net, cost components, refund/window/attribution và control-defined estimand đã khóa; reconciliation trong tolerance chốt trước | Ledger/data contract + audit; **thiếu dữ liệu** |
| G2 Independent design | Holdout mới chưa dùng selection; entity/time/randomization units đúng; mọi trial và seeds ghi trước | Split/hash + preregistration; **chưa tạo** |
| G3 Predictive claim | Nếu công bố dự đoán tốt hơn baseline: trên cùng holdout mới, primary-loss gain vượt business MDE và cận dưới paired 95% CI >0; calibration/nhóm đạt tolerance khóa trước | Forecast metrics và uncertainty đúng target; **chưa có ứng viên đạt trên dữ liệu cũ** |
| G4 Feasible actions/support | 100% action đề xuất thỏa constraints/eligibility; không action ngoài support; propensity/ESS và weight diagnostics đạt ngưỡng power khóa trước | Constraint catalog, assignment audit, support report; **chưa có** |
| G5 Policy value | Fixed policy có cận dưới 95% của incremental net profit lớn hơn mức lợi ích tối thiểu `delta_business >0` đã duyệt, dưới budget; safety/risk upper bounds đạt guardrails | Heldout OPE đủ giả định và RCT/pilot độc lập trong population đích; **chưa có** |
| G6 Operations/release | Có abstain, drift/outcome-lag monitoring, versioned evidence, rollback và human review; review xác nhận scope | Hồ sơ nghiệm thu + quyết định phát hành riêng; **chưa thực hiện** |

G3 là gate cho tuyên bố prediction; không thay G5 cho causal policy. Một policy uplift có thể có giá trị dù overall response RMSE không tăng; phải dùng đúng claim/estimand, không tự loại mọi hướng causal vì benchmark ROI cũ. Ngược lại, dự đoán tốt không đủ mở khuyến nghị. Website hiện tại chưa đạt cả cơ sở prediction lẫn policy.

Các ngưỡng 5%, số mẫu 200/500, interval coverage hoặc PSI từng đề nghị ở Phase 4B.1 giữ nguyên như hồ sơ lịch sử; không áp máy móc cho target binary/uplift mới và không sửa chúng. Giao thức mới phải nêu trước primary/secondary metrics, MDE, CI/multiplicity, power, ngưỡng rủi ro và abstention theo nhu cầu thực tế. Những tham số chưa có không được mặc định PASS.

## 10. Công việc tương lai và điều kiện dừng

| Bước đề nghị | Deliverable | Quy tắc dừng |
|---|---|---|
| Thẩm định nguồn shortlist | Rights/version/sampling/timing audit, acceptance decision | Thiếu quyền hoặc không nhận diện treatment/outcome thì không ingest/fit |
| Chốt scope đồ án và contract | Chọn một action space, outcome, horizon và population | Không gọi conversion/revenue là ROI khi thiếu chi phí |
| Thiết kế protocol độc lập | Power/MDE, baselines, split và registration | Không đủ events/controls/units thì thu thêm hoặc thu hẹp claim |
| Nghiên cứu riêng có giới hạn | All trials, prediction và causal/policy metrics đúng scope | Không tăng search vô hạn khi không có gain có ý nghĩa |
| Thu first-party/pilot | Experiment logs, ledger, fixed-policy RCT, risk evaluation | Không mở rộng triển khai khi cận lợi ích/guardrails chưa đạt |
| Review phát hành riêng | Evidence/gates và phạm vi ứng dụng | Không tự nâng Quality Gate hoặc phát hành `/optimize` |

**Không thực hiện các bước tương lai ở trên trong Phase 4B.3.** Đã hoàn tất khảo sát và kiến trúc đề nghị; blocker còn lại là data rights/provenance, target economics, availability/assignment, dữ liệu độc lập và power/pilot. Không có kết quả huấn luyện mới; không có mô hình chiến thắng mới; không có bằng chứng thực tế để bật khuyến nghị.

Kiểm tra bảo toàn/tài liệu ở [verification_results.json](verification_results.json). Giữ **BASELINE_ONLY**, Frontend/Backend, bảy artifact và kết quả lịch sử. **Dừng tại PHASE 4B.3.**
