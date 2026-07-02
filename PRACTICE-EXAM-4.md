# AWS Solutions Architect Associate (SAA-C03) - Practice Exam 4

> **Instructions:** Read each question carefully. Click on the answer to reveal the correct solution and explanation.

---

## Question 46

A company is designing a disaster recovery strategy for its primary production system running on AWS. The RTO (Recovery Time Objective) is 4 hours and the RPO (Recovery Point Objective) is 1 hour. The system runs on EC2 instances with an RDS database.

Which solution meets these requirements with the LOWEST cost?

- **A.** Use a pilot light approach with a scaled-down version always running in a secondary Region.
- **B.** Use a warm standby approach with full capacity in a secondary Region.
- **C.** Use a backup and restore approach with regular snapshots.
- **D.** Use a hot standby with multi-Region active-active configuration.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: A**

The pilot light approach maintains a minimal version of the environment always running (usually just the database with read replica), then rapidly scales up when needed. This meets the 4-hour RTO and 1-hour RPO at the lowest cost compared to maintaining full warm or hot standby environments.

</details>

---

## Question 47

A company is migrating a 3-tier application to AWS. The web tier requires static IP addresses for firewall whitelisting by external partners. The application tier needs to process background jobs from a queue. The database tier uses MySQL.

Which solution meets these requirements with the highest availability?

- **A.** Use EC2 instances with Elastic IPs for the web tier, EC2 Auto Scaling for the application tier, and RDS MySQL Multi-AZ for the database.
- **B.** Use Application Load Balancer for the web tier, Lambda for the application tier, and DynamoDB for the database.
- **C.** Use Network Load Balancer with static IP for the web tier, EC2 Auto Scaling with SQS for the application tier, and Aurora MySQL for the database.
- **D.** Use CloudFront for the web tier, ECS for the application tier, and Redshift for the database.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: C**

Network Load Balancer provides static IP addresses (Elastic IPs) that can be whitelisted by partners. The application tier using EC2 Auto Scaling with SQS provides reliable background job processing. Aurora MySQL provides better performance and availability than standard RDS for MySQL.

</details>

---

## Question 48

A company has a high-performance computing (HPC) workload that requires low-latency network communication between instances. The workload is parallel and requires high network throughput. The instances need to access a shared file system.

Which combination of AWS services meets these requirements?

- **A.** Use EC2 instances in a cluster placement group with Amazon FSx for Lustre.
- **B.** Use EC2 instances spread across multiple Availability Zones with Amazon EFS.
- **C.** Use EC2 instances with enhanced networking and Amazon S3.
- **D.** Use Lambda functions with high memory configuration and DynamoDB.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: A**

EC2 cluster placement groups pack instances close together in the same Availability Zone, providing low-latency, high-throughput networking (10 Gbps+). Amazon FSx for Lustre is a high-performance file system optimized for HPC workloads that provides sub-millisecond latencies and high throughput.

</details>

---

## Question 49

A company operates a microservices architecture on AWS. The services communicate using REST APIs. The company needs to implement a solution that handles partial failures gracefully when one service is temporarily unavailable, without failing the entire request.

Which design pattern should the solutions architect recommend?

- **A.** Use a circuit breaker pattern with exponential backoff.
- **B.** Use synchronous API calls with increased timeout values.
- **C.** Use a single monolithic service instead of microservices.
- **D.** Use direct database connections between services.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: A**

The circuit breaker pattern prevents an application from repeatedly trying to execute an operation that's likely to fail. When a service is unavailable, the circuit breaker "opens" and returns a fallback response immediately, preventing cascade failures. Combined with exponential backoff for retry attempts, it provides graceful degradation.

</details>

---

## Question 50

A company is implementing a machine learning pipeline on AWS. The pipeline involves preprocessing large datasets (100+ GB), training models that require GPU instances, and serving predictions with low latency requirements.

Which combination of AWS services is MOST cost-effective for this workflow?

- **A.** Use AWS Glue for preprocessing, Amazon SageMaker for training with spot instances, and SageMaker endpoints for predictions.
- **B.** Use EMR for all stages of the pipeline.
- **C.** Use EC2 instances for preprocessing and training, and deploy models on-premises.
- **D.** Use Lambda for preprocessing and training, and API Gateway for predictions.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: A**

AWS Glue is serverless and cost-effective for data preprocessing. Amazon SageMaker with Managed Spot Training can reduce training costs by up to 90%. SageMaker endpoints provide low-latency predictions and automatically scale. This combination optimizes costs at each stage of the ML pipeline.

</details>

---

## Question 51

A company needs to implement a security solution that inspects all traffic entering and leaving a VPC. The solution must provide intrusion detection, payload inspection, and traffic filtering. The company wants a managed solution to minimize operational overhead.

Which AWS service meets these requirements?

- **A.** AWS WAF
- **B.** AWS Shield Advanced
- **C.** AWS Network Firewall
- **D.** Amazon GuardDuty

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: C**

AWS Network Firewall is a managed firewall service that provides traffic inspection, intrusion detection and prevention, and URL filtering for VPC traffic. It operates at the network layer (layer 3-7) and can inspect both inbound and outbound traffic, providing comprehensive protection with minimal operational overhead.

</details>

---

## Question 52

A company is building a serverless application that processes images uploaded by users. The application needs to generate thumbnails of various sizes for each uploaded image. The processing should happen asynchronously, and users should not wait for thumbnail generation to complete.

Which solution meets these requirements with the LEAST operational complexity?

- **A.** Use S3 event notifications to trigger a Lambda function that generates thumbnails.
- **B.** Use EC2 instances with a cron job to poll for new images.
- **C.** Use an SQS queue polled by ECS containers running thumbnail generation software.
- **D.** Use Kinesis Data Streams to process image data.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: A**

S3 event notifications can directly trigger Lambda functions when new objects are created. Lambda scales automatically to handle concurrent uploads and generates thumbnails asynchronously. This serverless approach requires no infrastructure management and has the least operational complexity.

</details>

---

## Question 53

A company has an application that processes time-sensitive financial transactions. The application currently runs in a single Availability Zone. The company needs to improve the availability of the application while ensuring data consistency during failover events.

Which solution meets these requirements?

- **A.** Deploy the application across multiple Availability Zones using an Application Load Balancer. Use Amazon RDS Multi-AZ for the database.
- **B.** Deploy the application in multiple Regions with DynamoDB Global Tables.
- **C.** Use EC2 Auto Scaling with spot instances across multiple Availability Zones.
- **D.** Deploy the application on larger EC2 instance types in the same Availability Zone.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: A**

Deploying across multiple AZs with an ALB provides high availability for the application tier. Amazon RDS Multi-AZ maintains a synchronous standby replica in a different Availability Zone, ensuring data consistency during failover with automatic failover typically completing within 60-120 seconds.

</details>

---

## Question 54

A solutions architect is designing a logging solution for an application deployed on EC2 instances across multiple Availability Zones. The logs must be centralized, searchable, and retained for 5 years. The solution must provide real-time log analysis capabilities.

Which combination of AWS services meets these requirements?

- **A.** Use the CloudWatch agent to collect logs, CloudWatch Logs for storage, and CloudWatch Logs Insights for analysis.
- **B.** Use S3 to store logs and Athena to query them.
- **C.** Write logs to EBS volumes and use snapshots for retention.
- **D.** Use CloudTrail to capture all API calls and store in S3.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: A**

The CloudWatch agent collects logs from EC2 instances and sends them to CloudWatch Logs. CloudWatch Logs supports retention policies up to 10 years. CloudWatch Logs Insights provides real-time query capabilities with a specialized query language for log analysis. This is a fully managed solution with minimal operational overhead.

</details>

---

## Question 55

A company has an API that experiences unpredictable traffic patterns. During peak hours, the API receives 10,000 requests per second, but during off-peak hours, it receives only 100 requests per second. The company wants to optimize costs while maintaining consistent performance.

Which solution meets these requirements?

- **A.** Use Amazon API Gateway with usage plans and throttle limits.
- **B.** Use an Application Load Balancer with EC2 Auto Scaling based on request count.
- **C.** Use API Gateway with a Lambda backend using provisioned concurrency.
- **D.** Use API Gateway with a Lambda backend and enable automatic scaling.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: D**

Amazon API Gateway with AWS Lambda provides automatic scaling from zero to thousands of requests per second without any configuration. You pay only for the requests you receive and the compute time consumed. Lambda automatically scales to match the request rate, making it ideal for unpredictable traffic patterns.

</details>

---

## Question 56

A company is implementing a data lake solution on AWS. The solution needs to ingest data from various sources including databases, IoT devices, and application logs. The data needs to be transformed before analysis. The company wants a serverless solution to minimize infrastructure management.

Which combination of AWS services meets these requirements?

- **A.** Use Kinesis Data Firehose for ingestion, Lambda for transformation, and S3 for storage.
- **B.** Use Amazon MQ for ingestion, EC2 for transformation, and RDS for storage.
- **C.** Use Direct Connect for ingestion, EMR for transformation, and Redshift for storage.
- **D.** Use S3 for ingestion, Athena for transformation, and DynamoDB for storage.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: A**

Kinesis Data Firehose is a serverless service that captures, transforms, and loads streaming data into S3. It can invoke Lambda functions to transform data before delivery. Amazon S3 provides durable, scalable storage for the data lake. All components are serverless and require minimal operational management.

</details>

---

## Question 57

A company needs to migrate a 50 TB Oracle database to AWS. The database is heavily used during business hours (9 AM - 6 PM). The company wants to minimize downtime during the migration and ensure data consistency.

Which solution meets these requirements?

- **A.** Use AWS Database Migration Service (DMS) with continuous replication.
- **B.** Export the database to S3 and import into Amazon RDS.
- **C.** Use AWS Snowball to transfer data, then use DMS for ongoing replication.
- **D.** Create a read replica in AWS and promote it when ready.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: A**

AWS DMS supports one-time migrations and continuous data replication using change data capture (CDC). This allows the source database to remain operational during migration. For 50 TB, DMS can continuously replicate changes, enabling a brief cutover window with minimal downtime while ensuring data consistency.

</details>

---

## Question 58

A solutions architect needs to design a secure network architecture for a multi-tier application. The web tier must be accessible from the internet, the application tier should only be accessible from the web tier, and the database tier should only be accessible from the application tier.

Which combination of AWS features should be used?

- **A.** Use one VPC with public subnets for web tier, private subnets for application and database tiers, and security groups to control access between tiers.
- **B.** Use three separate VPCs and peer them together.
- **C.** Use public subnets for all tiers with NACLs restricting traffic.
- **D.** Use a single subnet with security groups for isolation.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: A**

A single VPC with proper subnet placement (public for web, private for app and database) provides network isolation. Security groups act as stateful firewalls at the instance level, controlling traffic between tiers by allowing only web tier security group to access application tier, and application tier security group to access database tier.

</details>

---

## Question 59

A company is building a mobile application that needs to store user preferences and session data. The data must be accessible globally with low latency. The number of users is expected to grow from thousands to millions. The solution should require minimal database administration.

Which AWS service meets these requirements?

- **A.** Amazon RDS with read replicas in multiple Regions.
- **B.** Amazon DynamoDB Global Tables.
- **C.** Amazon ElastiCache with Redis cluster.
- **D.** Amazon DocumentDB with global clusters.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: B**

Amazon DynamoDB Global Tables provides a fully managed, multi-Region, multi-active database that delivers fast, local read and write performance for globally distributed applications. It automatically scales to handle millions of users and replicates data across Regions with minimal administration required.

</details>

---

## Question 60

A company is deploying a containerized application that requires persistent storage for shared data between containers. The storage must support concurrent access from multiple containers and provide high throughput for large file processing.

Which storage solution meets these requirements?

- **A.** Amazon EBS gp3 volumes
- **B.** Amazon EFS
- **C.** Amazon FSx for Lustre
- **D.** Instance store volumes

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: B**

Amazon EFS provides a fully managed, serverless elastic NFS file system that supports concurrent access from thousands of containers. It provides high throughput modes suitable for large file processing and automatically scales capacity as files are added or removed, making it ideal for container shared storage.

</details>

---

**End of Practice Exam 4**

> **Tip:** Review any questions you got wrong and study the explanations before moving to the next exam.

---

**Navigation:**
- [Practice Exam 3](./PRACTICE-EXAM-3.md)
- [Practice Exam 5](./PRACTICE-EXAM-5.md)
