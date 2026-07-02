# AWS Solutions Architect Associate (SAA-C03) - Practice Exam 3

> **Instructions:** Read each question carefully. Click on the answer to reveal the correct solution and explanation.

---

## Question 31

A company that hosts its web application on AWS wants to ensure all Amazon EC2 instances, Amazon RDS DB instances, and Amazon Redshift clusters are configured with tags. The company wants to minimize the effort of configuring and operating this check.

What should a solutions architect do to accomplish this?

- **A.** Use AWS Config rules to define and detect resources that are not properly tagged.
- **B.** Create a Lambda function to check tags daily.
- **C.** Use AWS Systems Manager to enforce tagging.
- **D.** Manually audit resources monthly.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: A**

AWS Config enables you to assess, audit, and evaluate configurations of your AWS resources. You can use AWS Config managed rules like `required-tags` to automatically detect non-compliant resources and receive notifications when resources are created or modified without required tags.

</details>

---

## Question 32

A development team needs to host a website that will be accessed by other teams. The website contents consist of HTML, CSS, client-side JavaScript, and images.

Which method is the MOST cost-effective for hosting the website?

- **A.** Deploy the website on EC2 instances behind an Application Load Balancer.
- **B.** Create an Amazon S3 bucket and host the website there.
- **C.** Use AWS Amplify to host the website.
- **D.** Deploy the website using Amazon CloudFront with a custom origin.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: B**

Amazon S3 provides highly scalable and cost-effective object storage. For static websites (HTML, CSS, JavaScript, images), S3 static website hosting is the most cost-effective option. You only pay for storage and data transfer, with no compute costs.

</details>

---

## Question 33

A company runs an online marketplace web application on AWS. The application serves hundreds of thousands of users during peak hours. The company needs a scalable, near-real-time solution to share the details of millions of financial transactions with several other internal applications. Transactions also need to be processed to remove sensitive data before being stored in a document database for low-latency retrieval.

What should a solutions architect recommend to meet these requirements?

- **A.** Use Amazon Kinesis Data Streams to ingest transactions. Use AWS Lambda to process and filter the data. Store results in Amazon DynamoDB.
- **B.** Store transactions in Amazon RDS and use read replicas for other applications.
- **C.** Use Amazon SQS to queue transactions for processing.
- **D.** Store transactions in Amazon S3 and query with Athena.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: A**

Amazon Kinesis Data Streams can ingest millions of transactions in real-time. AWS Lambda can process and filter sensitive data as events occur. Amazon DynamoDB provides low-latency access to the processed data. This serverless architecture scales automatically with demand.

</details>

---

## Question 34

A solutions architect is designing a cloud architecture for a new application being deployed on AWS. The application allows users to interactively upload and download files. Files older than 2 years will be accessed less frequently. The solutions architect needs to ensure that the application can scale to any number of files while maintaining high availability and durability.

Which scalable solutions meet these requirements? (Choose two.)

- **A.** Store the files in Amazon S3 with a lifecycle policy that moves objects older than 2 years to S3 Glacier.
- **B.** Store the files in Amazon Elastic File System (Amazon EFS) with a lifecycle policy that moves objects older than 2 years to EFS Infrequent Access.
- **C.** Store the files in Amazon S3. Use a secondary Amazon S3 bucket for files older than 2 years.
- **D.** Use AWS Storage Gateway to store files on premises and back up to S3.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answers: A, B**

Amazon S3 with lifecycle policies provides unlimited scalability, 11 9's durability, and automatically transitions older files to cost-effective storage classes like Glacier.

Amazon EFS with Infrequent Access lifecycle management provides scalable file storage for interactive workloads while optimizing costs for older files.

</details>

---

## Question 35

A company's website provides users with customized recommendations based on their historical activity data. The data is saved directly on Amazon S3 in a dedicated prefix for each user. The recommendation engine runs on Amazon EC2 instances that need to access the data. When the website traffic is very high, the recommendation engine becomes slow because the data processing in Amazon S3 is slower than expected.

Which solution will meet the requirement for faster data access?

- **A.** Use Amazon DynamoDB Accelerator (DAX) to cache the data.
- **B.** Copy the data to EC2 instance store volumes during startup.
- **C.** Use Amazon S3 Transfer Acceleration for the data access.
- **D.** Use Amazon ElastiCache for Redis to cache S3 data locally.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: C**

Amazon S3 Transfer Acceleration enables fast, easy, and secure transfers of files over long distances between your client and S3 bucket. It leverages CloudFront's globally distributed edge locations to accelerate object uploads and downloads, improving data access speed during high traffic periods.

</details>

---

## Question 36

A media company is planning to migrate its on-premises data center to AWS. The company needs to transfer approximately 200 TB of video footage to Amazon S3. The company's internet connection is 1 Gbps and is shared with other business-critical applications.

Which solution meets the requirements for data transfer?

- **A.** Use AWS DataSync to transfer the data over the internet connection.
- **B.** Use multiple AWS Snowball Edge devices to transfer the data.
- **C.** Set up a VPN connection for the transfer.
- **D.** Use AWS Direct Connect for a temporary connection.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: B**

For 200 TB of data, AWS Snowball Edge devices are the most efficient option. Each Snowball Edge can hold up to 80 TB (Snowball Edge Storage Optimized). Three devices can handle the full 200 TB without impacting the shared internet connection, with data transferred at up to 100 Gbps locally.

</details>

---

## Question 37

A company has an application that ingests clickstream data and stores it in Amazon S3. The company needs to query this data using SQL to gain insights into user behavior. The queries are ad-hoc and run on-demand. The company wants a solution with minimal infrastructure management.

Which solution meets these requirements?

- **A.** Use Amazon Athena to query the data directly in S3.
- **B.** Load the data into Amazon Redshift for analysis.
- **C.** Use Amazon EMR with Hive to query the data.
- **D.** Import the data into Amazon RDS and run queries there.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: A**

Amazon Athena is a serverless query service that allows you to analyze data directly in Amazon S3 using standard SQL. You pay only for the queries you run, with no infrastructure to manage. It's ideal for ad-hoc analysis of clickstream data.

</details>

---

## Question 38

A solutions architect is designing the architecture for a new web application. The application requires a relational database that can scale read capacity horizontally. The database must support complex joins and transactions. The application is deployed in multiple Availability Zones.

Which AWS service meets these requirements?

- **A.** Amazon DynamoDB
- **B.** Amazon Aurora
- **C.** Amazon DocumentDB
- **D.** Amazon Keyspaces

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: B**

Amazon Aurora is a fully managed relational database engine that's compatible with MySQL and PostgreSQL. It provides up to 15 read replicas for horizontal read scaling, supports complex joins and transactions, and automatically replicates data across multiple Availability Zones.

</details>

---

## Question 39

A company is running a legacy application on-premises. The application has a business-critical Windows file share that stores approximately 20 TB of data. The company wants to migrate this file share to AWS and provide access to both on-premises users and EC2 instances.

Which solution meets these requirements with minimal changes to the existing applications?

- **A.** Use AWS Storage Gateway File Gateway to provide SMB access to S3 storage.
- **B.** Migrate the data to Amazon FSx for Windows File Server.
- **C.** Use Amazon EFS with SMB compatibility enabled.
- **D.** Deploy a Windows Server on EC2 with shared storage.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: A**

AWS Storage Gateway File Gateway provides a seamless way to connect on-premises environments to AWS cloud storage. It presents standard SMB/NFS file shares to on-premises applications while storing the data in Amazon S3. This allows both on-premises users and EC2 instances to access the same data with minimal changes.

</details>

---

## Question 40

A company is building a real-time analytics dashboard that displays streaming data from IoT sensors. The dashboard needs to show data with sub-second latency and support millions of events per second. The data only needs to be stored for 24 hours.

Which combination of AWS services meets these requirements?

- **A.** Use Amazon Kinesis Data Streams for ingestion and Amazon OpenSearch Service for real-time analytics.
- **B.** Use Amazon SQS for message queuing and Amazon RDS for storage.
- **C.** Use Amazon MQ for message brokering and DynamoDB for storage.
- **D.** Use Amazon SNS for notifications and S3 for storage.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: A**

Amazon Kinesis Data Streams can handle millions of events per second with sub-second latency. Amazon OpenSearch Service (successor to Elasticsearch) provides real-time search and analytics capabilities on streaming data. Data can be configured with a 24-hour retention policy.

</details>

---

## Question 41

A solutions architect needs to design a highly available database solution for an ecommerce application. The database currently experiences spikes in read traffic during promotional events and must maintain availability during these spikes. The solution should minimize operational overhead.

Which solution meets these requirements?

- **A.** Use Amazon RDS with Multi-AZ deployment and enable Auto Scaling for read replicas.
- **B.** Use Amazon DynamoDB with on-demand capacity mode.
- **C.** Deploy the database on EC2 with clustering software.
- **D.** Use Amazon Redshift for the database.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: A**

Amazon RDS with Multi-AZ provides high availability with automatic failover. Read replicas can be configured with Auto Scaling to handle read traffic spikes during promotional events. This is a fully managed solution that minimizes operational overhead.

</details>

---

## Question 42

A company has a web application that stores session data in memory on each web server. The company is migrating the application to AWS and wants to ensure that session data persists even if an EC2 instance fails or is terminated. The session data must be accessible quickly by any web server.

Which solution meets these requirements?

- **A.** Store session data in Amazon S3.
- **B.** Store session data in Amazon DynamoDB with DAX.
- **C.** Store session data in Amazon EBS volumes.
- **D.** Store session data in Amazon EFS.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: B**

Amazon DynamoDB with DynamoDB Accelerator (DAX) provides a fast, fully managed in-memory cache for DynamoDB. Session data persists in DynamoDB (surviving instance failures) while DAX provides microsecond-level read latency for quick access by any web server.

</details>

---

## Question 43

A company needs to archive financial records for 7 years to meet regulatory requirements. The records must be retained but are rarely accessed after the first month. When access is needed, the company can wait up to 12 hours for retrieval.

Which is the MOST cost-effective storage solution?

- **A.** S3 Standard with versioning
- **B.** S3 Glacier Deep Archive
- **C.** S3 Intelligent-Tiering
- **D.** Amazon EBS Cold HDD volumes

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: B**

S3 Glacier Deep Archive is the lowest-cost storage class in AWS, designed for long-term retention of data that is rarely accessed. With retrieval times of up to 12 hours and very low storage costs, it's ideal for regulatory archives with infrequent access requirements.

</details>

---

## Question 44

A solutions architect is designing a system to store medical images. The system needs to provide millisecond-level access to frequently accessed images and must maintain images for at least 7 years to comply with healthcare regulations. The system should automatically optimize storage costs based on access patterns.

Which solution meets these requirements?

- **A.** Use Amazon S3 with S3 Intelligent-Tiering and a 7-year retention policy.
- **B.** Store images in Amazon EBS and create snapshots daily.
- **C.** Use Amazon S3 with a lifecycle policy to move images to Glacier after 30 days.
- **D.** Deploy a custom storage solution on EC2 instances.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: A**

S3 Intelligent-Tiering automatically optimizes costs by moving objects between frequent and infrequent access tiers based on access patterns. It provides millisecond-level access for frequently accessed data while reducing costs for rarely accessed data. Combined with Object Lock for retention compliance, it meets all requirements.

</details>

---

## Question 45

A company's application generates log files that are 5 GB in size. The log files must be stored for 5 years. The files are rarely accessed after the first month, but must be available immediately when needed.

Which storage solution meets these requirements MOST cost-effectively?

- **A.** S3 Standard-IA with lifecycle policy
- **B.** S3 Glacier Instant Retrieval
- **C.** S3 One Zone-IA
- **D.** S3 Glacier Deep Archive

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: B**

S3 Glacier Instant Retrieval provides the lowest cost storage for long-lived, rarely accessed data that requires immediate access (millisecond retrieval). It's ideal for archive data that needs to be retained for years but available instantly when needed.

</details>

---

**End of Practice Exam 3**

> **Tip:** Review any questions you got wrong and study the explanations before moving to the next exam.

---

**Navigation:**
- [Practice Exam 2](./PRACTICE-EXAM-2.md)
- [Practice Exam 4](./PRACTICE-EXAM-4.md)
